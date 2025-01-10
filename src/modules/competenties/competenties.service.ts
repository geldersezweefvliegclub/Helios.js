import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {IHeliosService} from "../../core/services/IHeliosService";
import {DbService} from "../../database/db-service/db.service";
import {EventEmitter2} from "@nestjs/event-emitter";
import {Prisma, RefCompetentie} from "@prisma/client";
import {GetObjectsRefCompetentiesRequest} from "./GetObjectsRefCompetentiesRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {GetObjectsRefCompetentiesResponse} from "./GetObjectsRefCompetentiesResponse";
import {DatabaseEvents} from "../../core/helpers/Events";

@Injectable()
export class CompetentiesService extends IHeliosService
{
   constructor(private readonly logger: Logger,
               private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   async GetObject(id: number, relation:string = undefined): Promise<RefCompetentie>
   {
      const db = await this.dbService.refCompetentie.findUnique({
         where: {
            ID: id
         },
         include: this.SelectStringToInclude<Prisma.RefCompetentieInclude>(relation)
      });
      if (!db)
         throw new HttpException(`Competentie record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      return db;
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params?: GetObjectsRefCompetentiesRequest): Promise<IHeliosGetObjectsResponse<GetObjectsRefCompetentiesResponse>>
   {
      if (params === undefined)
      {
         params = new GetObjectsRefCompetentiesRequest();
         params.VERWIJDERD = false;
      }
      const where: Prisma.RefCompetentieWhereInput =
         {
            AND:
               [
                  { ID: params.ID },
                  { VERWIJDERD: params.VERWIJDERD ?? false },
                  { ID: { in: params.IDs }},
                  { LEERFASE_ID: params.LEERFASE_ID}
               ]
         };

      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined) {
         count = await this.dbService.refCompetentie.count({ where });
      }

      const objs = await this.dbService.refCompetentie.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.RefCompetentieOrderByWithRelationInput>(params.SORT ?? "VOLGORDE, ID"),
         take: params.MAX,
         skip: params.START,
         include: {
            LeerfaseType: true
         },
      });

      const response = objs.map((obj) => {
         // copy relevant fields from child objects to the parent object
         const retObj = {
            ...obj,
            LEERFASE: obj.LeerfaseType?.OMSCHRIJVING ?? null
         } ;

         // delete child objects from the response
         delete retObj.LeerfaseType;

         return  retObj as GetObjectsRefCompetentiesResponse
      });
      return this.buildGetObjectsResponse(response, count, params.HASH);
   }

   async AddObject(data: Prisma.RefCompetentieCreateInput ): Promise<RefCompetentie>
   {
      const obj = await this.dbService.refCompetentie.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.RefCompetentieUpdateInput): Promise<RefCompetentie>
   {
      const db = await this.GetObject(id);
      const obj = await this.dbService.refCompetentie.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id, db, data, obj);
      return obj;
   }

   async RemoveObject(id: number): Promise<void> {
      const db = await this.GetObject(id);
      await this.dbService.refCompetentie.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name,  id, db);
   }
}
