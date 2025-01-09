import {Injectable} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {Prisma, RefType} from '@prisma/client';
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {IHeliosService} from "../../core/services/IHeliosService";
import {GetObjectsRefTypesRequest} from "./GetObjectsRefTypesRequest";
import {DatabaseEvents} from "../../core/helpers/Events";
import {EventEmitter2} from "@nestjs/event-emitter";
import {GetObjectsRefTypesResponse} from "./GetObjectsRefTypesResponse";

@Injectable()
export class TypesService extends IHeliosService
{
   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   async GetObject(id: number, relation :string = undefined): Promise<RefType>
   {
      return this.dbService.refType.findUnique({
         where: {
            ID: id
         },
         include: this.SelectStringToInclude<Prisma.RefTypeInclude>(relation)
      });
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params?: GetObjectsRefTypesRequest): Promise<IHeliosGetObjectsResponse<GetObjectsRefTypesResponse>>
   {
      if(!params) {
         params = {
            VERWIJDERD: false
         }
      }

      const sort = params.SORT ? params.SORT : "SORTEER_VOLGORDE, ID";         // set the sort order if not defined default to SORTEER_VOLGORDE

      // create the where clause
      const where: Prisma.RefTypeWhereInput =
      {
         AND:
         [
            {ID: params.ID},
            {TYPEGROEP_ID: params.GROEP},
            {VERWIJDERD: params.VERWIJDERD ?? false},
            {ID: {in: params.IDs}}
         ]
      }

      let count;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.refType.count({where: where});
      }
      const objs = await this.dbService.refType.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.RefTypeOrderByWithRelationInput>(sort),
         take: params.MAX,
         skip: params.START,
         include: {
            TypesGroep: true
         }
      });

      const response = objs.map((obj) => {
         // copy relevant fields from child objects to the parent object
         const retObj = {
            ...obj,
            GROEP: obj.TypesGroep?.OMSCHRIJVING ?? null,
         } ;

         // delete child objects from the response
         delete retObj.TypesGroep;

         return  retObj as GetObjectsRefTypesResponse
      });
      return this.buildGetObjectsResponse(response, count, params.HASH);
   }

   async AddObject(data: Prisma.RefTypeCreateInput ): Promise<RefType>
   {
      const obj = await this.dbService.refType.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.RefTypeUpdateInput): Promise<RefType>
   {
      const db = this.GetObject(id);
      const obj = await this.dbService.refType.update({
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
      await this.dbService.refType.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name,  id, db);
   }
}
