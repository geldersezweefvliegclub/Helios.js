import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperAanwezigVliegtuig} from "@prisma/client";
import {GetObjectsOperAanwezigVliegtuigenRequest} from "./GetObjectsOperAanwezigVliegtuigenRequest";
import {GetObjectsOperAanwezigVliegtuigenResponse} from "./GetObjectsOperAanwezigVliegtuigenResponse";
import {safeStringify} from "../../core/helpers/LogHelper";
import {parseDateOnly, parseTimeOnly, toDateOnly, toTimeOnly} from "../../core/helpers/DateOnly";

// aanwezig vliegtuig record inclusief de relaties die de PHP aanwezig_vliegtuigen_view samenvoegt
type AanwezigVliegtuigMetRelaties = Prisma.OperAanwezigVliegtuigGetPayload<{
   include: {
      Vliegtuig: { include: { VliegtuigType: true } },
      Veld: true,
   }
}>;

@Injectable()
export class AanwezigVliegtuigenService extends IHeliosService
{
   private readonly logger = new Logger(AanwezigVliegtuigenService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number, relation: string = undefined): Promise<OperAanwezigVliegtuig>
   {
      this.logger.verbose(`AanwezigVliegtuigenService.GetObject(${safeStringify({id, relation})})`);
      // relatie wordt meegenomen voor consistentie met andere services, maar wordt niet gebruikt
      const db = await this.dbService.operAanwezigVliegtuig.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`AanwezigVliegtuig record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      const result = db;
      this.logger.verbose(`AanwezigVliegtuigenService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsOperAanwezigVliegtuigenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperAanwezigVliegtuigenResponse>>
   {
      this.logger.verbose(`AanwezigVliegtuigenService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
      {
         params = new GetObjectsOperAanwezigVliegtuigenRequest();
         params.VERWIJDERD = false;
      }
      const where: Prisma.OperAanwezigVliegtuigWhereInput =
         {
            AND:
               [
                  { ID: params.ID},
                  { VERWIJDERD: params.VERWIJDERD ?? false},
                  { ID: { in: params.IDs }},
                  params.NIET_VERTROKKEN ? { VERTREK: null } : {},
               ]
         }
      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.operAanwezigVliegtuig.count({where: where});
      }
      const objs = await this.dbService.operAanwezigVliegtuig.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperAanwezigVliegtuigOrderByWithRelationInput>(params.SORT ?? "DATUM"),
         take: params.MAX,
         skip: params.START,
         include: {
            Vliegtuig: {
               include: {
                  VliegtuigType: true,
               }
            },
            Veld: true,
         }
      });

      const response = await this.NaarGetObjectsResponse(objs);

      const result = this.buildGetObjectsResponse(response, count, params.HASH);
      this.logger.verbose(`AanwezigVliegtuigenService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   // voegt de velden toe die de PHP aanwezig_vliegtuigen_view samenvoegt: vliegtuig- en type-gegevens via joins,
   // en of het vliegtuig momenteel aan het vliegen is via een gebatchte aggregatie op oper_startlijst
   private async NaarGetObjectsResponse(objs: AanwezigVliegtuigMetRelaties[]): Promise<GetObjectsOperAanwezigVliegtuigenResponse[]>
   {
      this.logger.verbose(`AanwezigVliegtuigenService.NaarGetObjectsResponse(${safeStringify({objs})})`);
      if (objs.length === 0)
      {
         const result = [];
         this.logger.verbose(`AanwezigVliegtuigenService.NaarGetObjectsResponse() => ${safeStringify(result)}`);
         return result;
      }

      const vliegtuigIds = [...new Set(objs.map(obj => obj.VLIEGTUIG_ID))];
      const datums = [...new Map(objs.map(obj => [obj.DATUM.getTime(), obj.DATUM])).values()];
      const vluchtenVanVandaag = await this.dbService.operStartlijst.findMany({
         where: {
            VERWIJDERD: false,
            VLIEGTUIG_ID: {in: vliegtuigIds},
            DATUM: {in: datums}
         }
      });

      const vliegtVliegtuigenPerDatum = new Set<string>();
      for (const vlucht of vluchtenVanVandaag)
      {
         if (vlucht.STARTTIJD !== null && vlucht.LANDINGSTIJD === null)
            vliegtVliegtuigenPerDatum.add(`${vlucht.VLIEGTUIG_ID}_${vlucht.DATUM.getTime()}`);
      }

      const result = objs.map(obj =>
      {
         const {Vliegtuig: vliegtuig, Veld: veld, ...aanwezigVliegtuig} = obj;

         return {
            ...aanwezigVliegtuig,
            DATUM: toDateOnly(aanwezigVliegtuig.DATUM) as unknown as Date,
            AANKOMST: toTimeOnly(aanwezigVliegtuig.AANKOMST) as unknown as Date,
            VERTREK: toTimeOnly(aanwezigVliegtuig.VERTREK) as unknown as Date,
            REGISTRATIE: vliegtuig.REGISTRATIE,
            CALLSIGN: vliegtuig.CALLSIGN,
            REG_CALL: `${vliegtuig.REGISTRATIE ?? ''} (${vliegtuig.CALLSIGN ?? ''})`,
            ZITPLAATSEN: vliegtuig.ZITPLAATSEN,
            CLUBKIST: vliegtuig.CLUBKIST,
            FLARMCODE: vliegtuig.FLARMCODE,
            TYPE_ID: vliegtuig.TYPE_ID,
            VLIEGTUIGTYPE_OMS: vliegtuig.VliegtuigType?.OMSCHRIJVING ?? null,
            TMG: vliegtuig.TMG,
            ZELFSTART: vliegtuig.ZELFSTART,
            SLEEPKIST: vliegtuig.SLEEPKIST,
            VOLGORDE: vliegtuig.VOLGORDE,
            INZETBAAR: vliegtuig.INZETBAAR,
            TRAINER: vliegtuig.TRAINER,
            OPMERKINGEN: vliegtuig.OPMERKINGEN,
            VELD: veld?.OMSCHRIJVING ?? null,
            VLIEGT: vliegtVliegtuigenPerDatum.has(`${obj.VLIEGTUIG_ID}_${obj.DATUM.getTime()}`) ? 1 : 0,
         } as GetObjectsOperAanwezigVliegtuigenResponse;
      });
      this.logger.verbose(`AanwezigVliegtuigenService.NaarGetObjectsResponse() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.OperAanwezigVliegtuigCreateInput): Promise<OperAanwezigVliegtuig>
   {
      this.logger.verbose(`AanwezigVliegtuigenService.AddObject(${safeStringify({data})})`);
      // VERWIJDERD en LAATSTE_AANPASSING zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      data.DATUM = parseDateOnly(data.DATUM as Date | string) as Date;
      data.AANKOMST = parseTimeOnly(data.AANKOMST as Date | string | null);
      data.VERTREK = parseTimeOnly(data.VERTREK as Date | string | null);

      const obj = await this.dbService.operAanwezigVliegtuig.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      const result = {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         AANKOMST: toTimeOnly(obj.AANKOMST) as unknown as Date,
         VERTREK: toTimeOnly(obj.VERTREK) as unknown as Date,
      };
      this.logger.verbose(`AanwezigVliegtuigenService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   async UpdateObject(id: number, data: Prisma.OperAanwezigVliegtuigUpdateInput): Promise<OperAanwezigVliegtuig>
   {
      this.logger.verbose(`AanwezigVliegtuigenService.UpdateObject(${safeStringify({id, data})})`);
      // VERWIJDERD en LAATSTE_AANPASSING zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete (data as {ID?: number}).ID;
      data.DATUM = parseDateOnly(data.DATUM as Date | string) as Date;
      data.AANKOMST = parseTimeOnly(data.AANKOMST as Date | string | null);
      data.VERTREK = parseTimeOnly(data.VERTREK as Date | string | null);

      const db = await this.GetObject(id);
      const obj = await this.dbService.operAanwezigVliegtuig.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, data, obj);
      const result = {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         AANKOMST: toTimeOnly(obj.AANKOMST) as unknown as Date,
         VERTREK: toTimeOnly(obj.VERTREK) as unknown as Date,
      };
      this.logger.verbose(`AanwezigVliegtuigenService.UpdateObject() => ${safeStringify(result)}`);
      return result;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`AanwezigVliegtuigenService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.operAanwezigVliegtuig.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db, actorId);
   }
}
