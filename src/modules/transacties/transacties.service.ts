import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperTransactie} from "@prisma/client";
import {GetObjectsOperTransactiesRequest} from "./GetObjectsOperTransactiesRequest";
import {GetObjectsOperTransactiesResponse} from "./GetObjectsOperTransactiesResponse";
import {safeStringify} from "../../core/helpers/LogHelper";
import {parseDateOnly, toDateOnly} from "../../core/helpers/DateOnly";

@Injectable()
export class TransactiesService extends IHeliosService
{
   private readonly logger = new Logger(TransactiesService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number, relation: string = undefined): Promise<OperTransactie>
   {
      this.logger.verbose(`TransactiesService.GetObject(${safeStringify({id, relation})})`);
      // relatie wordt meegenomen voor consistentie met andere services, maar wordt niet gebruikt
      const db = await this.dbService.operTransactie.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`Transactie record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      const result = db;
      this.logger.verbose(`TransactiesService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsOperTransactiesRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperTransactiesResponse>>
   {
      this.logger.verbose(`TransactiesService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
      {
         params = new GetObjectsOperTransactiesRequest();
         params.VERWIJDERD = false;
      }
      const dtSpanne = params.VanTot(params.DATUM, params.BEGIN_DATUM, params.EIND_DATUM);
      const where: Prisma.OperTransactieWhereInput =
         {
            AND:
               [
                  { ID: params.ID},
                  { LID_ID: params.LID_ID},
                  { VERWIJDERD: params.VERWIJDERD ?? false},
                  { ID: { in: params.IDs }},
                  { EXT_REF: params.EXT_REF},
                  { VLIEGDAG: params.VLIEGDAG},

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
         count = await this.dbService.operTransactie.count({where: where});
      }
      const rawObjs = await this.dbService.operTransactie.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperTransactieOrderByWithRelationInput>(params.SORT ?? "DATUM"),
         take: params.MAX,
         skip: params.START,
         include: {
            RefLid: true,
            RefIngevoerd: true,
            TypeTransactie: true
         }
      });

      const objs = rawObjs.map((obj) => {
         const retObj = {
            ...obj,
            VLIEGDAG: toDateOnly(obj.VLIEGDAG) as unknown as Date,
            NAAM: obj.RefLid?.NAAM ?? null,
            INGEVOERD: obj.RefIngevoerd?.NAAM ?? null,
            TYPE: obj.TypeTransactie?.OMSCHRIJVING ?? null,
         };

         delete retObj.RefLid;
         delete retObj.RefIngevoerd;
         delete retObj.TypeTransactie;

         return retObj as GetObjectsOperTransactiesResponse;
      });

      const result = this.buildGetObjectsResponse(objs, count, params.HASH);
      this.logger.verbose(`TransactiesService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.OperTransactieCreateInput): Promise<OperTransactie>
   {
      this.logger.verbose(`TransactiesService.AddObject(${safeStringify({data})})`);
      data.VLIEGDAG = parseDateOnly(data.VLIEGDAG as Date | string | null);
      const obj = await this.dbService.operTransactie.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      const result = {...obj, VLIEGDAG: toDateOnly(obj.VLIEGDAG) as unknown as Date};
      this.logger.verbose(`TransactiesService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   async UpdateObject(id: number, data: Prisma.OperTransactieUpdateInput): Promise<OperTransactie>
   {
      this.logger.verbose(`TransactiesService.UpdateObject(${safeStringify({id, data})})`);
      data.VLIEGDAG = parseDateOnly(data.VLIEGDAG as Date | string | null);
      const db = await this.GetObject(id);
      const obj = await this.dbService.operTransactie.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, data, obj);
      const result = {...obj, VLIEGDAG: toDateOnly(obj.VLIEGDAG) as unknown as Date};
      this.logger.verbose(`TransactiesService.UpdateObject() => ${safeStringify(result)}`);
      return result;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`TransactiesService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.operTransactie.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db, actorId);
   }
}
