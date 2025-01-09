import { Injectable } from '@nestjs/common';
import {IHeliosService} from "../../core/services/IHeliosService";
import {DbService} from "../../database/db-service/db.service";
import {EventEmitter2} from "@nestjs/event-emitter";
import {Prisma, OperAgenda} from "@prisma/client";
import {GetObjectsOperAgendaRequest} from "./GetObjectsOperAgendaRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {DatabaseEvents} from "../../core/helpers/Events";

@Injectable()
export class AgendaService extends IHeliosService
{
   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }
   
   // retrieve a single object from the database based on the id
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   async GetObject(id: number, relation: string = undefined): Promise<OperAgenda>
   {
      // relation is included for consistency with other services, but not used

      return this.dbService.operAgenda.findUnique({
         where: {
            ID: id
         },
      });
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params?: GetObjectsOperAgendaRequest): Promise<IHeliosGetObjectsResponse<OperAgenda>>
   {
      if (params === undefined)
      {
         params = new GetObjectsOperAgendaRequest();
         params.VERWIJDERD = false;
      }

      const sort = params.SORT ? params.SORT : "SORTEER_VOLGORDE, ID";         // set the sort order if not defined default to SORTEER_VOLGORDE

      // create the where clause
      const where: Prisma.OperAgendaWhereInput =
         {
            AND:
               [
                  {ID: params.ID},
                  {VERWIJDERD: params.VERWIJDERD ?? false},
                  {ID: {in: params.IDs}}
               ]
         }

      const objs = await this.dbService.operAgenda.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperAgendaOrderByWithRelationInput>(sort),
         take: params.MAX,
         skip: params.START});

      let count;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.operAgenda.count({where: where});
      }
      return this.buildGetObjectsResponse(objs, count, params.HASH);
   }

   async AddObject(data: Prisma.OperAgendaCreateInput): Promise<OperAgenda>
   {
      const obj = await this.dbService.operAgenda.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.OperAgendaUpdateInput): Promise<OperAgenda>
   {
      const db = this.GetObject(id);
      const obj = await this.dbService.operAgenda.update({
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
      const db = this.GetObject(id);
      await this.dbService.operAgenda.delete({
         where: {
            ID: id
         }
      });

      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db);
   }
}
