import {Injectable} from '@nestjs/common';
import {DbService} from "../../../database/db-service/db.service";
import {Prisma, RefTypesGroep} from '@prisma/client';
import {IHeliosGetObjectsResponse} from "../../../core/DTO/IHeliosGetObjectsReponse";
import {IHeliosService} from "../../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../../core/helpers/Events";
import {GetObjectsRefTypesGroepRequest} from "../DTO/TypesGroepDTO";

@Injectable()
export class TypesGroepenService extends IHeliosService
{
   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   async GetObject(id: number): Promise<RefTypesGroep>
   {
      return this.dbService.refTypesGroep.findUnique({
         where: {
            ID: id
         }
      });
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params: GetObjectsRefTypesGroepRequest): Promise<IHeliosGetObjectsResponse<RefTypesGroep>>
   {
      const sort = params.SORT ? params.SORT : "SORTEER_VOLGORDE, ID";         // set the sort order if not defined default to SORTEER_VOLGORDE
      const verwijderd = params.VERWIJDERD ? params.VERWIJDERD : false;  // if verwijderd is not defined default to false to show only active records

      // create the where clause
      const where: Prisma.RefTypesGroepWhereInput =
         {
            ID: params.ID,
            VERWIJDERD: verwijderd,
            AND: {
               ID: {in: params.IDs}
            }
         }

      const objs = await this.dbService.refTypesGroep.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.RefTypesGroepOrderByWithRelationInput>(sort),
         select: this.SelectStringToSelectObj<Prisma.RefTypesGroepSelect>(params.VELDEN),
         take: params.MAX,
         skip: params.START
      });

      return this.buildGetObjectsResponse(objs);
   }

   async AddObject(data: Prisma.RefTypesGroepCreateInput): Promise<RefTypesGroep>
   {
      const obj = await this.dbService.refTypesGroep.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.RefTypesGroepUpdateInput): Promise<RefTypesGroep>
   {
      const db = this.GetObject(id);
      const obj = await this.dbService.refTypesGroep.update({
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
      await this.dbService.refTypesGroep.delete({
         where: {
            ID: id
         }
      });

      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db);
   }
}
