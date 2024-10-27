import {Injectable} from '@nestjs/common';
import {DbService} from "../../../database/db-service/db.service";
import {Prisma, RefTypes} from '@prisma/client';
import {IHeliosGetObjectsResponse} from "../../../core/DTO/IHeliosGetObjectsReponse";
import {IHeliosService} from "../../../core/services/IHeliosService";
import {GetObjectsRefTypesRequest} from "../DTO/TypesDTO";
import {DatabaseEvents} from "../../../core/helpers/Events";
import {EventEmitter2, OnEvent} from "@nestjs/event-emitter";

@Injectable()
export class TypesService extends IHeliosService
{
   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   async GetObject(id: number): Promise<RefTypes>
   {
      return this.dbService.refTypes.findUnique({
         where: {
            ID: id
         }
      });
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params: GetObjectsRefTypesRequest): Promise<IHeliosGetObjectsResponse<RefTypes>>
   {
      const sort = params.SORT ? params.SORT : "SORTEER_VOLGORDE, ID";         // set the sort order if not defined default to SORTEER_VOLGORDE
      const verwijderd = params.VERWIJDERD ? params.VERWIJDERD : false;  // if verwijderd is not defined default to false to show only active records

      // create the where clause
      const where: Prisma.RefTypesWhereInput =
         {
            ID: params.ID,
            VERWIJDERD: verwijderd,
            AND: {
               ID: {in: params.IDs}
            }
         }

      const objs = await this.dbService.refTypes.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.RefTypesOrderByWithRelationInput>(sort),
         select: this.SelectStringToSelectObj<Prisma.RefTypesSelect>(params.VELDEN),
         take: params.MAX,
         skip: params.START
      });

      return this.buildGetObjectsResponse(objs);
   }

   async AddObject(data: Prisma.RefTypesCreateInput ): Promise<RefTypes>
   {
      const obj = await this.dbService.refTypes.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.RefTypesUpdateInput): Promise<RefTypes>
   {
      const db = this.GetObject(id);
      const obj = await this.dbService.refTypes.update({
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
      await this.dbService.refTypes.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name,  id, db);
   }
}
