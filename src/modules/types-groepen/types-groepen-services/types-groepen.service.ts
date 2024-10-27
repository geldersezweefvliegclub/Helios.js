import {Injectable} from '@nestjs/common';
import {DbService} from "../../../database/db-service/db.service";
import {Prisma, RefTypesGroepen} from '@prisma/client';
import {IHeliosGetObjectsResponse} from "../../../core/DTO/IHeliosGetObjectsReponse";
import {IHeliosService} from "../../../core/services/IHeliosService";
import {GetObjectsRefTypesGroepenRequest} from "../DTO/TypesGroepenDTO";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../../core/helpers/Events";

@Injectable()
export class TypesGroepenService extends IHeliosService
{
   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   async GetObject(id: number): Promise<RefTypesGroepen>
   {
      return this.dbService.refTypesGroepen.findUnique({
         where: {
            ID: id
         }
      });
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params: GetObjectsRefTypesGroepenRequest): Promise<IHeliosGetObjectsResponse<RefTypesGroepen>>
   {
      const sort = params.SORT ? params.SORT : "SORTEER_VOLGORDE, ID";         // set the sort order if not defined default to SORTEER_VOLGORDE
      const verwijderd = params.VERWIJDERD ? params.VERWIJDERD : false;  // if verwijderd is not defined default to false to show only active records

      // create the where clause
      const where: Prisma.RefTypesGroepenWhereInput =
         {
            ID: params.ID,
            VERWIJDERD: verwijderd,
            AND: {
               ID: {in: params.IDs}
            }
         }

      const objs = await this.dbService.refTypesGroepen.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.RefTypesGroepenOrderByWithRelationInput>(sort),
         select: this.Select<Prisma.RefTypesGroepenSelect>(params.VELDEN),
         take: params.MAX,
         skip: params.START
      });

      return this.buildGetObjectsResponse(objs);
   }

   async AddObject(data: Prisma.RefTypesGroepenCreateInput): Promise<RefTypesGroepen>
   {
      const obj = await this.dbService.refTypesGroepen.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.RefTypesGroepenUpdateInput): Promise<RefTypesGroepen>
   {
      const db = this.GetObject(id);
      const obj = await this.dbService.refTypesGroepen.update({
         where: {
            ID: id
         },
         data: data
      });
      // this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, data, obj);
      return obj;
   }

   async RemoveObject(id: number): Promise<void>
   {
      const db = this.GetObject(id);
      await this.dbService.refTypesGroepen.delete({
         where: {
            ID: id
         }
      });

      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db);
   }
}
