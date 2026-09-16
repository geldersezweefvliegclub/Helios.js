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

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number, date?: Date, relation: string = undefined): Promise<OperDagInfo>
   {
      this.logger.verbose(`DagInfoService.GetObject(${safeStringify({id, date, relation})})`);
      // relatie wordt meegenomen voor consistentie met andere services, maar wordt niet gebruikt
      const db = await this.dbService.operDagInfo.findFirst({
         where: {
            ID: id ? id : undefined,
            DATUM: date ? date : undefined
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
      {
         params = new GetObjectsOperDagInfoRequest();
         params.VERWIJDERD = false;
      }
      const where: Prisma.OperDagInfoWhereInput =
         {
            AND:
               [
                  { ID: params.ID},
                  { VERWIJDERD: params.VERWIJDERD ?? false},
                  { ID: { in: params.IDs }}
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

      const response = await this.NaarGetObjectsResponse(objs);

      const result = this.buildGetObjectsResponse(response, count, params.HASH);
      this.logger.verbose(`DagInfoService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   // voegt de velden toe die de PHP daginfo_view samenvoegt
   private async NaarGetObjectsResponse(objs: DagInfoMetRelaties[]): Promise<GetObjectsOperDagInfoResponse[]>
   {
      this.logger.verbose(`DagInfoService.NaarGetObjectsResponse(${safeStringify({objs})})`);
      const result = objs.map((obj) => {
         const retObj = {
            ...obj,
            DATUM: toDateOnly(obj.DATUM) as unknown as Date,
            VELD_CODE: obj.Veld?.CODE ?? null,
            VELD_OMS: obj.Veld?.OMSCHRIJVING ?? null,
            BAAN_CODE: obj.Baan?.CODE ?? null,
            BAAN_OMS: obj.Baan?.OMSCHRIJVING ?? null,
            STARTMETHODE_CODE: obj.StartMethode?.CODE ?? null,
            STARTMETHODE_OMS: obj.StartMethode?.OMSCHRIJVING ?? null,
            VELD_CODE2: obj.Veld2?.CODE ?? null,
            VELD_OMS2: obj.Veld2?.OMSCHRIJVING ?? null,
            BAAN_CODE2: obj.Baan2?.CODE ?? null,
            BAAN_OMS2: obj.Baan2?.OMSCHRIJVING ?? null,
            STARTMETHODE_CODE2: obj.StartMethode2?.CODE ?? null,
            STARTMETHODE_OMS2: obj.StartMethode2?.OMSCHRIJVING ?? null,
         };

         delete retObj.Veld;
         delete retObj.Baan;
         delete retObj.StartMethode;
         delete retObj.Veld2;
         delete retObj.Baan2;
         delete retObj.StartMethode2;

         return retObj as GetObjectsOperDagInfoResponse;
      });
      this.logger.verbose(`DagInfoService.NaarGetObjectsResponse() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.OperDagInfoCreateInput, actorId: number): Promise<OperDagInfo>
   {
      this.logger.verbose(`DagInfoService.AddObject(${safeStringify({data})})`);
      const obj = await this.dbService.operDagInfo.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj, actorId);
      this.logger.verbose(`DagInfoService.AddObject() => ${safeStringify(obj)}`);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.OperDagInfoUpdateInput, actorId: number): Promise<OperDagInfo>
   {
      this.logger.verbose(`DagInfoService.UpdateObject(${safeStringify({id, data})})`);
      const db = await this.GetObject(id);
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
}
