import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperTransactie} from "@prisma/client";
import {GetObjectsOperTransactiesRequest} from "./GetObjectsOperTransactiesRequest";
import {GetObjectsOperTransactiesResponse} from "./GetObjectsOperTransactiesResponse";

@Injectable()
export class TransactiesService extends IHeliosService
{
   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   async GetObject(id: number, relation: string = undefined): Promise<OperTransactie>
   {
      // relation is included for consistency with other services, but not used
      const db = await this.dbService.operTransactie.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`Transactie record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      return db;
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params?: GetObjectsOperTransactiesRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperTransactiesResponse>>
   {
      if (params === undefined)
      {
         params = new GetObjectsOperTransactiesRequest();
         params.VERWIJDERD = false;
      }
      const where: Prisma.OperTransactieWhereInput =
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
         count = await this.dbService.operTransactie.count({where: where});
      }
      const objs = await this.dbService.operTransactie.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperTransactieOrderByWithRelationInput>(params.SORT ?? "DATUM"),
         take: params.MAX,
         skip: params.START});

      return this.buildGetObjectsResponse(objs, count, params.HASH);
   }

   async AddObject(data: Prisma.OperTransactieCreateInput): Promise<OperTransactie>
   {
      const obj = await this.dbService.operTransactie.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.OperTransactieUpdateInput): Promise<OperTransactie>
   {
      const db = await this.GetObject(id);
      const obj = await this.dbService.operTransactie.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, data, obj);
      return obj;
   }

   async RemoveObject(id: number): Promise<void>
   {
      const db = await this.GetObject(id);
      await this.dbService.operTransactie.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db);
   }
}
