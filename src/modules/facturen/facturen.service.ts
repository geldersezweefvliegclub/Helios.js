import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperFactuur} from "@prisma/client";
import {GetObjectsOperFacturenRequest} from "./GetObjectsOperFacturenRequest";
import {GetObjectsOperFacturenResponse} from "./GetObjectsOperFacturenResponse";

@Injectable()
export class FacturenService extends IHeliosService
{
   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   async GetObject(id: number, relation: string = undefined): Promise<OperFactuur>
   {
      // relation is included for consistency with other services, but not used
      const db = await this.dbService.operFactuur.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`Factuur record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      return db;
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params?: GetObjectsOperFacturenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperFacturenResponse>>
   {
      if (params === undefined)
      {
         params = new GetObjectsOperFacturenRequest();
         params.VERWIJDERD = false;
      }
      const where: Prisma.OperFactuurWhereInput =
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
         count = await this.dbService.operFactuur.count({where: where});
      }
      const objs = await this.dbService.operFactuur.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperFactuurOrderByWithRelationInput>(params.SORT ?? "DATUM"),
         take: params.MAX,
         skip: params.START});

      return this.buildGetObjectsResponse(objs, count, params.HASH);
   }

   async AddObject(data: Prisma.OperFactuurCreateInput): Promise<OperFactuur>
   {
      const obj = await this.dbService.operFactuur.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.OperFactuurUpdateInput): Promise<OperFactuur>
   {
      const db = await this.GetObject(id);
      const obj = await this.dbService.operFactuur.update({
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
      await this.dbService.operFactuur.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db);
   }
}
