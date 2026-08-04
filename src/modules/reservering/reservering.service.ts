import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperReservering, RefLid} from "@prisma/client";
import {GetObjectsOperReserveringRequest} from "./GetObjectsOperReserveringRequest";
import {GetObjectsOperReserveringResponse} from "./GetObjectsOperReserveringResponse";
import {CreateOperReserveringDto} from "../../generated/nestjs-dto/create-operReservering.dto";
import {UpdateOperReserveringDto} from "../../generated/nestjs-dto/update-operReservering.dto";
import {safeStringify} from "../../core/helpers/LogHelper";
import {parseDateOnly, toDateOnly} from "../../core/helpers/DateOnly";

// reservering record inclusief de relaties die de PHP reservering_view samenvoegt
type ReserveringMetRelaties = Prisma.OperReserveringGetPayload<{
   include: {
      RefLid: true,
      RefVliegtuig: true,
   }
}>;

@Injectable()
export class ReserveringService extends IHeliosService
{
   private readonly logger = new Logger(ReserveringService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number, relation: string = undefined): Promise<OperReservering>
   {
      this.logger.verbose(`ReserveringService.GetObject(${safeStringify({id, relation})})`);
      // relatie wordt meegenomen voor consistentie met andere services, maar wordt niet gebruikt.
      // Net als in de PHP implementatie wordt hier de ruwe tabel gebruikt, niet de reservering_view.
      const db = await this.dbService.operReservering.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`Reservering record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      const result = db;
      this.logger.verbose(`ReserveringService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // Er mag maar een reservering per DATUM+VLIEGTUIG_ID bestaan, zie GetObjectByDetails() in class.Reservering.inc.php
   async GetObjectByDetails(datum: Date, vliegtuigId: number): Promise<OperReservering | null>
   {
      this.logger.verbose(`ReserveringService.GetObjectByDetails(${safeStringify({datum, vliegtuigId})})`);
      const result = await this.dbService.operReservering.findFirst({
         where: {
            DATUM: datum,
            VLIEGTUIG_ID: vliegtuigId,
            VERWIJDERD: false,
         }
      });
      this.logger.verbose(`ReserveringService.GetObjectByDetails() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsOperReserveringRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperReserveringResponse>>
   {
      this.logger.verbose(`ReserveringService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
      {
         params = new GetObjectsOperReserveringRequest();
         params.VERWIJDERD = false;
      }
      const dtSpanne = params.VanTot(params.DATUM, params.BEGIN_DATUM, params.EIND_DATUM);
      const where: Prisma.OperReserveringWhereInput =
         {
            AND:
               [
                  { ID: params.ID},
                  { VERWIJDERD: params.VERWIJDERD ?? false},
                  { ID: { in: params.IDs }},
                  { LID_ID: params.LID_ID },
                  { VLIEGTUIG_ID: params.VLIEGTUIG_ID },
                  {
                     DATUM:
                        {
                           gte: dtSpanne.start,
                           lte: dtSpanne.eind
                        }
                  }
               ]
         }
      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.operReservering.count({where: where});
      }
      // reservering_view sorteert op DATUM, VOLGORDE, maar VOLGORDE bestaat niet als kolom op oper_reservering
      const objs = await this.dbService.operReservering.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperReserveringOrderByWithRelationInput>(params.SORT ?? "DATUM"),
         take: params.MAX,
         skip: params.START,
         include: {
            RefLid: true,
            RefVliegtuig: true,
         }
      });

      const response = await this.NaarGetObjectsResponse(objs);

      const result = this.buildGetObjectsResponse(response, count, params.HASH);
      this.logger.verbose(`ReserveringService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   // voegt de velden toe die de PHP reservering_view samenvoegt. INGEVOERD_ID heeft geen Prisma relatie (enkel een
   // los ID veld), daarom wordt de naam van de invoerder via een aparte gebatchte RefLid lookup opgehaald.
   private async NaarGetObjectsResponse(objs: ReserveringMetRelaties[]): Promise<GetObjectsOperReserveringResponse[]>
   {
      this.logger.verbose(`ReserveringService.NaarGetObjectsResponse(${safeStringify({objs})})`);
      if (objs.length === 0)
      {
         const result: GetObjectsOperReserveringResponse[] = [];
         this.logger.verbose(`ReserveringService.NaarGetObjectsResponse() => ${safeStringify(result)}`);
         return result;
      }

      const ingevoerdIds = [...new Set(objs.map(obj => obj.INGEVOERD_ID))];
      const invoerders = await this.dbService.refLid.findMany({where: {ID: {in: ingevoerdIds}}});
      const invoerderPerId = new Map<number, RefLid>(invoerders.map(lid => [lid.ID, lid]));

      const result = objs.map(obj =>
      {
         const {RefLid: lid, RefVliegtuig: vliegtuig, ...reservering} = obj;
         return {
            ...reservering,
            DATUM: toDateOnly(reservering.DATUM) as unknown as Date,
            NAAM: lid.NAAM,
            PRIVACY: lid.PRIVACY,
            INGEVOERD_DOOR: invoerderPerId.get(obj.INGEVOERD_ID)?.NAAM,
            REGISTRATIE: vliegtuig.REGISTRATIE,
            CALLSIGN: vliegtuig.CALLSIGN,
            REG_CALL: `${vliegtuig.REGISTRATIE ?? ''} (${vliegtuig.CALLSIGN ?? ''})`,
         } as GetObjectsOperReserveringResponse;
      });
      this.logger.verbose(`ReserveringService.NaarGetObjectsResponse() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: CreateOperReserveringDto, user: RefLid): Promise<OperReservering>
   {
      this.logger.verbose(`ReserveringService.AddObject(${safeStringify({data, user})})`);
      // VERWIJDERD en LAATSTE_AANPASSING zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      const datum = parseDateOnly(data.DATUM as Date | string) as Date;
      // per DATUM+VLIEGTUIG_ID mag er maar een reservering bestaan
      const bestaand = await this.GetObjectByDetails(datum, data.VLIEGTUIG_ID);
      if (bestaand)
         throw new HttpException("Er bestaat al een reservering voor dit vliegtuig op deze datum", HttpStatus.CONFLICT);

      const {LID_ID, VLIEGTUIG_ID, ...rest} = data;
      const insertData: Prisma.OperReserveringCreateInput = {
         ...rest,
         DATUM: datum,
         RefLid: {connect: {ID: LID_ID}},
         RefVliegtuig: {connect: {ID: VLIEGTUIG_ID}},
         INGEVOERD_ID: user.ID,
      };

      const obj = await this.dbService.operReservering.create({
         data: insertData
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, insertData, obj);
      const result = {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
      this.logger.verbose(`ReserveringService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   async UpdateObject(id: number, data: UpdateOperReserveringDto | Prisma.OperReserveringUpdateInput): Promise<OperReservering>
   {
      this.logger.verbose(`ReserveringService.UpdateObject(${safeStringify({id, data})})`);
      // VERWIJDERD en LAATSTE_AANPASSING zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete (data as {ID?: number}).ID;
      const update = data as Prisma.OperReserveringUpdateInput;
      update.DATUM = parseDateOnly(update.DATUM as Date | string) as Date;

      const db = await this.GetObject(id);
      const obj = await this.dbService.operReservering.update({
         where: {
            ID: id
         },
         data: update
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id, db, data, obj);
      const result = {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
      this.logger.verbose(`ReserveringService.UpdateObject() => ${safeStringify(result)}`);
      return result;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`ReserveringService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.operReservering.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db, actorId);
   }

   // mag deze gebruiker nog een vliegtuig reserveren dit jaar? Enkel reserveringen die de gebruiker zelf heeft
   // ingevoerd voor zichzelf tellen mee, zie magNogReserveren() in class.Reservering.inc.php
   async MagNogReserveren(lidId: number): Promise<boolean>
   {
      this.logger.verbose(`ReserveringService.MagNogReserveren(${safeStringify({lidId})})`);
      const vandaag = new Date();
      const beginVandaag = new Date(vandaag.getFullYear(), vandaag.getMonth(), vandaag.getDate(), 0, 0, 0, 0);
      const eindJaar = new Date(vandaag.getFullYear(), 11, 31, 23, 59, 59, 999);

      const aantal = await this.dbService.operReservering.count({
         where: {
            LID_ID: lidId,
            INGEVOERD_ID: lidId,
            DATUM: {gt: beginVandaag, lte: eindJaar},
         }
      });
      const result = aantal === 0;
      this.logger.verbose(`ReserveringService.MagNogReserveren() => ${safeStringify(result)}`);
      return result;
   }
}