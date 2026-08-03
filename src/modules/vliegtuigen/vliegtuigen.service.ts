import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma} from "@prisma/client";
import {GetObjectsRefVliegtuigenRequest} from "./GetObjectsRefVliegtuigenRequest";
import {GetRefVliegtuigenResponse} from "./GetRefVliegtuigenResponse";
import {RefVliegtuigDto} from "../../generated/nestjs-dto/refVliegtuig.dto";
import {JournaalCategorie} from "../../core/enums/JournaalCategorie";
import {JournaalStatus} from "../../core/enums/JournaalStatus";
import {safeStringify} from "../../core/helpers/LogHelper";

// t/m JournaalStatus.Uitgesteld telt een journaal als openstaand (Opgelost/Afgetekend niet)
const JOURNAAL_STATUS_LAATSTE_OPENSTAAND = JournaalStatus.Uitgesteld;

@Injectable()
export class VliegtuigenService extends IHeliosService
{
   private readonly logger = new Logger(VliegtuigenService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number, relation:string = undefined): Promise<RefVliegtuigDto>
   {
      this.logger.verbose(`VliegtuigenService.GetObject(${safeStringify({id, relation})})`);
      const db = await this.dbService.refVliegtuig.findUnique({
         where: {
            ID: id
         },
         include: this.SelectStringToInclude<Prisma.RefVliegtuigInclude>(relation)
      });
      if (!db) {
         throw new HttpException(`Vliegtuig record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      }

      const result = new GetRefVliegtuigenResponse(db);
      this.logger.verbose(`VliegtuigenService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsRefVliegtuigenRequest): Promise<IHeliosGetObjectsResponse<GetRefVliegtuigenResponse>>
   {
      this.logger.verbose(`VliegtuigenService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
      {
         params = new GetObjectsRefVliegtuigenRequest();
         params.VERWIJDERD = false;
      }
      const where: Prisma.RefVliegtuigWhereInput =
         {
            AND:
               [
                  { ID: params.ID },
                  { VERWIJDERD: params.VERWIJDERD ?? false },
                  { ID: { in: params.IDs }},
                  { ID: { in: params.IN }},   // IN is enkel voor PHP compatibiliteit, functioneel gelijk aan IDs. TODO: verwijderen
                  { OR: [
                        { REGISTRATIE: { contains: params.SELECTIE }},
                        { CALLSIGN:    { contains: params.SELECTIE }},
                        { FLARMCODE:   { contains: params.SELECTIE }}
                     ]
                  },
                  { ZITPLAATSEN: params.ZITPLAATSEN},
                  { CLUBKIST: params.CLUBKIST},
                  { SLEEPKIST: params.SLEEPKIST},
                  { ZELFSTART: params.ZELFSTART },
                  { TMG: params.TMG },
                  { TYPE_ID: { in: params.TYPES }},
               ]
         }
      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.refVliegtuig.count({ where: where });
      }

      const objs = await this.dbService.refVliegtuig.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.RefVliegtuigOrderByWithRelationInput>(params.SORT ?? "CLUBKIST DESC, VOLGORDE, ID"),
         take: params.MAX,
         skip: params.START,
         include: {
            VliegtuigType: true,
            BevoegdheidLokaal: true,
            BevoegdheidOverland: true
         }
      });

      // aantal openstaande journaals per vliegtuig, gebatched voor alle opgehaalde vliegtuigen (was per record een subquery)
      const openJournaalsPerVliegtuig = await this.dbService.operJournaal.groupBy({
         by: ['VLIEGTUIG_ID'],
         where: {
            STATUS_ID: {lte: JOURNAAL_STATUS_LAATSTE_OPENSTAAND},
            CATEGORIE_ID: JournaalCategorie.Defect,
            VLIEGTUIG_ID: {in: objs.map(obj => obj.ID)}
         },
         _count: {_all: true}
      });
      const journaalAantalPerVliegtuig = new Map(openJournaalsPerVliegtuig.map(row => [row.VLIEGTUIG_ID, row._count._all]));

      const response = objs.map((obj) => {
         const resp = new GetRefVliegtuigenResponse(obj);
         resp.REG_CALL = `${obj.REGISTRATIE ?? ''} (${obj.CALLSIGN ?? ''})`;
         resp.BEVOEGDHEID_LOKAAL = obj.BevoegdheidLokaal?.OMSCHRIJVING ?? null;
         resp.BEVOEGDHEID_OVERLAND = obj.BevoegdheidOverland?.OMSCHRIJVING ?? null;
         resp.JOURNAAL_AANTAL = journaalAantalPerVliegtuig.get(obj.ID) ?? 0;

         // vliegtuig met een openstaand journaal is niet inzetbaar
         if (resp.JOURNAAL_AANTAL > 0)
            resp.INZETBAAR = false;

         return resp;
      });

      const result = this.buildGetObjectsResponse(response, count, params.HASH);
      this.logger.verbose(`VliegtuigenService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.RefVliegtuigCreateInput ): Promise<GetRefVliegtuigenResponse>
   {
      this.logger.verbose(`VliegtuigenService.AddObject(${safeStringify({data})})`);
      const dbVliegtuigen = await this.dbService.refVliegtuig.findFirst({
         where: {
            REGISTRATIE: data.REGISTRATIE,
            VERWIJDERD: false
         }
      })

      if (dbVliegtuigen) {
         throw new HttpException("Vliegtuig met registratie " + data.REGISTRATIE + " bestaat al", HttpStatus.CONFLICT);
      }

      const obj = await this.dbService.refVliegtuig.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      const result = new GetRefVliegtuigenResponse(obj);
      this.logger.verbose(`VliegtuigenService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   async UpdateObject(id: number, data: Prisma.RefVliegtuigUpdateInput): Promise<GetRefVliegtuigenResponse>
   {
      this.logger.verbose(`VliegtuigenService.UpdateObject(${safeStringify({id, data})})`);
      const db = await this.GetObject(id);

      // Dit moeten we ALTIJD doen, ook als er geen REGISTRATIE in de data zit. Bijvoorbeeld voor een restore
      const dbVliegtuigen = await this.dbService.refVliegtuig.findFirst({
         where: {
            REGISTRATIE: (typeof data.REGISTRATIE == "string") ? data.REGISTRATIE : db.REGISTRATIE,
            VERWIJDERD: false,
            ID:
            {
               not: id        // niet het ID meenemen wat we gaan updaten
            }
         }
      })

      if (dbVliegtuigen)
         throw new HttpException("Vliegtuig met registratie " + data.REGISTRATIE + " bestaat al", HttpStatus.CONFLICT);

      const obj = await this.dbService.refVliegtuig.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id, db, data, obj);
      const result = new GetRefVliegtuigenResponse(obj);
      this.logger.verbose(`VliegtuigenService.UpdateObject() => ${safeStringify(result)}`);
      return result;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`VliegtuigenService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.refVliegtuig.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name,  id, db, actorId);
   }
}
