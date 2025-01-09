
import {Injectable} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {OperBrandstof, Prisma} from '@prisma/client';
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {IHeliosService} from "../../core/services/IHeliosService";
import {DatabaseEvents} from "../../core/helpers/Events";
import {EventEmitter2} from "@nestjs/event-emitter";
import {GetObjectsOperBrandstofRequest} from "./GetObjectsOperBrandstofRequest";
import {GetObjectsOperBrandstofResponse} from "./GetObjectsOperBrandstofResponse";

@Injectable()
export class BrandstofService extends IHeliosService
{
   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   async GetObject(id: number, relation :string = undefined): Promise<OperBrandstof>
   {
      return this.dbService.operBrandstof.findUnique({
         where: {
            ID: id
         },
         include: this.SelectStringToInclude<Prisma.OperBrandstofInclude>(relation)
      });
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params?: GetObjectsOperBrandstofRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperBrandstofResponse>>
   {
      if (params === undefined)
      {
         params = new GetObjectsOperBrandstofRequest();
         params.VERWIJDERD = false;
      }
      const sort = params.SORT ? params.SORT : "TIJDSTIP DESC";         // set the sort order if not defined default to SORTEER_VOLGORDE

      // create the where clause
      const where: Prisma.OperBrandstofWhereInput =
         {
            AND:
               [
                  {ID: params.ID},
                  {VERWIJDERD: params.VERWIJDERD ?? false},
                  {ID: {in: params.IDs}}
               ]
         }

      let count;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.operBrandstof.count({where: where});
      }
      const objs = await this.dbService.operBrandstof.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperBrandstofOrderByWithRelationInput>(sort),
         take: params.MAX,
         skip: params.START,
         include: {
            BrandstofType: true
         }
      });

      const response = objs.map((obj) => {
         // copy relevant fields from child objects to the parent object
         const retObj = {
            ...obj,
            BRANDSTOF_TYPE: obj.BrandstofType?.OMSCHRIJVING ?? null,
         } ;

         // delete child objects from the response
         delete retObj.BrandstofType;

         return  retObj as GetObjectsOperBrandstofResponse
      });
      return this.buildGetObjectsResponse(response, count, params.HASH);
   }

   async AddObject(data: Prisma.OperBrandstofCreateInput ): Promise<OperBrandstof>
   {
      const obj = await this.dbService.operBrandstof.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.OperBrandstofUpdateInput): Promise<OperBrandstof>
   {
      const db = this.GetObject(id);
      const obj = await this.dbService.operBrandstof.update({
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
      await this.dbService.operBrandstof.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name,  id, db);
   }
}
