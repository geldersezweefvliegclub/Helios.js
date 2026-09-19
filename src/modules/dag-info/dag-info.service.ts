import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperDagInfo} from "@prisma/client";
import {GetObjectsOperDagInfoRequest} from "./GetObjectsOperDagInfoRequest";
import {GetObjectsOperDagInfoResponse} from "./GetObjectsOperDagInfoResponse";
import {safeStringify} from "../../core/helpers/LogHelper";
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";
import {toDateOnly} from "../../core/helpers/TimeDate";

// daginfo record inclusief de relaties die de PHP daginfo_view samenvoegt
type DagInfoMetRelaties = Prisma.OperDagInfoGetPayload<{
   include: {
      Veld: true,
      Baan: true,
      StartMethode: true,
      Veld2: true,
      Baan2: true,
      StartMethode2: true,
   }
}>;

@Injectable()
export class DagInfoService extends IHeliosService
{
   private readonly logger = new Logger(DagInfoService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID, of op basis van DATUM
   // PHP class.Daginfo.inc.php::GetObject() - bij opzoeken op DATUM wordt een verwijderd record genegeerd;
   // bij opzoeken op ID geldt deze beperking niet
   async GetObject(id: number, date?: Date): Promise<OperDagInfo>
   {
      this.logger.verbose(`DagInfoService.GetObject(${safeStringify({id, date})})`);
      const db = await this.dbService.operDagInfo.findFirst({
         where: {
            ID: id ? id : undefined,
            DATUM: date ? date : undefined,
            VERWIJDERD: (!id && date) ? false : undefined
         },
      });

      if (!db) {
         throw new HttpException(`DagInfo record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      }

      const result = db;
      this.logger.verbose(`DagInfoService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsOperDagInfoRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperDagInfoResponse>>
   {
      this.logger.verbose(`DagInfoService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
         params = MaakGetObjectsRequest(GetObjectsOperDagInfoRequest, {VERWIJDERD: false});
      const dtSpanne = params.VanTot(params.DATUM, params.BEGIN_DATUM, params.EIND_DATUM);
      const where: Prisma.OperDagInfoWhereInput =
         {
            AND:
               [
                  { ID: params.ID},
                  { VERWIJDERD: params.VERWIJDERD ?? false},
                  { ID: { in: params.IDs }},

                  {
                     OR: [
                        {
                           DATUM:
                               {
                                  gte: dtSpanne.start,
                                  lte: dtSpanne.eind
                               }
                        }
                     ]
                  }
               ]
         }
      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.operDagInfo.count({where: where});
      }
      const objs = await this.dbService.operDagInfo.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperDagInfoOrderByWithRelationInput>(params.SORT ?? "DATUM"),
         take: params.MAX,
         skip: params.START,
         include: {
            Veld: true,
            Baan: true,
            StartMethode: true,
            Veld2: true,
            Baan2: true,
            StartMethode2: true
         }
      });

      const response = await this.MaakGetObjectsResponseDataset(objs);

      const result = this.buildGetObjectsResponse(response, count, params.HASH);
      this.logger.verbose(`DagInfoService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   // maak de dataset voor de GetObjects response, inclusief de relaties met andere tabellen
   private async MaakGetObjectsResponseDataset(objs: DagInfoMetRelaties[]): Promise<GetObjectsOperDagInfoResponse[]>
   {
      this.logger.verbose(`DagInfoService.MaakGetObjectsResponseDataset(${safeStringify({objs})})`);
      const result = objs.map((obj) => {
         const {
            Veld: veld, Baan: baan, StartMethode: startMethode,
            Veld2: veld2, Baan2: baan2, StartMethode2: startMethode2, ...dagInfo
         } = obj;

         return {
            ...dagInfo,
            DATUM: toDateOnly(dagInfo.DATUM) as unknown as Date,
            VELD_CODE: veld?.CODE ?? null,
            VELD_OMS: veld?.OMSCHRIJVING ?? null,
            BAAN_CODE: baan?.CODE ?? null,
            BAAN_OMS: baan?.OMSCHRIJVING ?? null,
            STARTMETHODE_CODE: startMethode?.CODE ?? null,
            STARTMETHODE_OMS: startMethode?.OMSCHRIJVING ?? null,
            VELD_CODE2: veld2?.CODE ?? null,
            VELD_OMS2: veld2?.OMSCHRIJVING ?? null,
            BAAN_CODE2: baan2?.CODE ?? null,
            BAAN_OMS2: baan2?.OMSCHRIJVING ?? null,
            STARTMETHODE_CODE2: startMethode2?.CODE ?? null,
            STARTMETHODE_OMS2: startMethode2?.OMSCHRIJVING ?? null,
         } as GetObjectsOperDagInfoResponse;
      });
      this.logger.verbose(`DagInfoService.MaakGetObjectsResponseDataset() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.OperDagInfoUncheckedCreateInput, actorId: number): Promise<OperDagInfo>
   {
      this.logger.verbose(`DagInfoService.AddObject(${safeStringify({data})})`);
      if (data.DATUM != null) {
         await this.BestaandeDatum(data.DATUM as Date);
      }
      const obj = await this.dbService.operDagInfo.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj, actorId);
      this.logger.verbose(`DagInfoService.AddObject() => ${safeStringify(obj)}`);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.OperDagInfoUncheckedUpdateInput, actorId: number): Promise<OperDagInfo>
   {
      this.logger.verbose(`DagInfoService.UpdateObject(${safeStringify({id, data})})`);
      const db = await this.GetObject(id);
      if (db.VERWIJDERD == true && data.VERWIJDERD == false) {
         // als het record gemarkeerd was als verwijderd en nu weer actief wordt, checken we of er al een ander actief record is met dezelfde datum
         await this.BestaandeDatum(db.DATUM);
      }
      else if (data.DATUM != null && toDateOnly(data.DATUM as Date) !== toDateOnly(db.DATUM)) {
         await this.BestaandeDatum(data.DATUM as Date);
      }
      const obj = await this.dbService.operDagInfo.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, data, obj, actorId);
      this.logger.verbose(`DagInfoService.UpdateObject() => ${safeStringify(obj)}`);
      return obj;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`DagInfoService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.operDagInfo.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db, actorId);
   }

   // Een DATUM mag maar bij één actief (niet-verwijderd) record voorkomen
   private async BestaandeDatum(datum: Date): Promise<void>
   {
      const bestaand = await this.dbService.operDagInfo.findFirst({
         where: {
            DATUM: datum,
            VERWIJDERD: false
         }
      });

      if (bestaand) {
         throw new HttpException(`Er bestaat al een DagInfo record voor DATUM ${toDateOnly(datum)}`, HttpStatus.CONFLICT);
      }
   }
}
