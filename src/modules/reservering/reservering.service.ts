import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
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
   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   async GetObject(id: number, relation: string = undefined): Promise<OperReservering>
   {
      // relation is included for consistency with other services, but not used.
      // Net als in de PHP implementatie wordt hier de ruwe tabel gebruikt, niet de reservering_view.
      const db = await this.dbService.operReservering.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`Reservering record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      return db;
   }

   // Er mag maar een reservering per DATUM+VLIEGTUIG_ID bestaan, zie GetObjectByDetails() in class.Reservering.inc.php
   async GetObjectByDetails(datum: Date, vliegtuigId: number): Promise<OperReservering | null>
   {
      return this.dbService.operReservering.findFirst({
         where: {
            DATUM: datum,
            VLIEGTUIG_ID: vliegtuigId,
            VERWIJDERD: false,
         }
      });
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params?: GetObjectsOperReserveringRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperReserveringResponse>>
   {
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

      return this.buildGetObjectsResponse(response, count, params.HASH);
   }

   // voegt de velden toe die de PHP reservering_view samenvoegt. INGEVOERD_ID heeft geen Prisma relatie (enkel een
   // los ID veld), daarom wordt de naam van de invoerder via een aparte gebatchte RefLid lookup opgehaald.
   private async NaarGetObjectsResponse(objs: ReserveringMetRelaties[]): Promise<GetObjectsOperReserveringResponse[]>
   {
      if (objs.length === 0) return [];

      const ingevoerdIds = [...new Set(objs.map(obj => obj.INGEVOERD_ID))];
      const invoerders = await this.dbService.refLid.findMany({where: {ID: {in: ingevoerdIds}}});
      const invoerderPerId = new Map<number, RefLid>(invoerders.map(lid => [lid.ID, lid]));

      return objs.map(obj =>
      {
         const {RefLid: lid, RefVliegtuig: vliegtuig, ...reservering} = obj;
         return {
            ...reservering,
            NAAM: lid.NAAM,
            PRIVACY: lid.PRIVACY,
            INGEVOERD_DOOR: invoerderPerId.get(obj.INGEVOERD_ID)?.NAAM,
            REGISTRATIE: vliegtuig.REGISTRATIE,
            CALLSIGN: vliegtuig.CALLSIGN,
            REG_CALL: `${vliegtuig.REGISTRATIE ?? ''} (${vliegtuig.CALLSIGN ?? ''})`,
         } as GetObjectsOperReserveringResponse;
      });
   }

   async AddObject(data: CreateOperReserveringDto, user: RefLid): Promise<OperReservering>
   {
      // per DATUM+VLIEGTUIG_ID mag er maar een reservering bestaan
      const bestaand = await this.GetObjectByDetails(new Date(data.DATUM), data.VLIEGTUIG_ID);
      if (bestaand)
         throw new HttpException("Er bestaat al een reservering voor dit vliegtuig op deze datum", HttpStatus.CONFLICT);

      const {LID_ID, VLIEGTUIG_ID, ...rest} = data;
      const insertData: Prisma.OperReserveringCreateInput = {
         ...rest,
         DATUM: data.DATUM,
         RefLid: {connect: {ID: LID_ID}},
         RefVliegtuig: {connect: {ID: VLIEGTUIG_ID}},
         INGEVOERD_ID: user.ID,
      };

      const obj = await this.dbService.operReservering.create({
         data: insertData
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, insertData, obj);
      return obj;
   }

   async UpdateObject(id: number, data: UpdateOperReserveringDto | Prisma.OperReserveringUpdateInput): Promise<OperReservering>
   {
      const db = await this.GetObject(id);
      const obj = await this.dbService.operReservering.update({
         where: {
            ID: id
         },
         data: data as Prisma.OperReserveringUpdateInput
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id, db, data, obj);
      return obj;
   }

   async RemoveObject(id: number): Promise<void>
   {
      const db = await this.GetObject(id);
      await this.dbService.operReservering.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db);
   }

   // mag deze gebruiker nog een vliegtuig reserveren dit jaar? Enkel reserveringen die de gebruiker zelf heeft
   // ingevoerd voor zichzelf tellen mee, zie magNogReserveren() in class.Reservering.inc.php
   async MagNogReserveren(lidId: number): Promise<boolean>
   {
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
      return aantal === 0;
   }
}