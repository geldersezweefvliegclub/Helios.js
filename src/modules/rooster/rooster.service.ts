import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperRooster} from "@prisma/client";
import {GetObjectsOperRoosterRequest} from "./GetObjectsOperRoosterRequest";
import {GetObjectsOperRoosterResponse} from "./GetObjectsOperRoosterResponse";

@Injectable()
export class RoosterService extends IHeliosService
{
   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   async GetObject(id: number, relation: string = undefined): Promise<OperRooster>
   {
      // relation is included for consistency with other services, but not used
      const db = await this.dbService.operRooster.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`Rooster record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      return db;
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params?: GetObjectsOperRoosterRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperRoosterResponse>>
   {
      if (params === undefined)
      {
         params = new GetObjectsOperRoosterRequest();
         params.VERWIJDERD = false;
      }
      const dtSpanne = params.VanTot(params.DATUM, params.BEGIN_DATUM, params.EIND_DATUM);
      const where: Prisma.OperRoosterWhereInput =
         {
            AND:
               [
                  { ID: params.ID},
                  { VERWIJDERD: params.VERWIJDERD ?? false},
                  { ID: { in: params.IDs }},
                  {
                     OR: [
                        {
                           DATUM:
                               {
                                  gte: dtSpanne.startTime,
                                  lte: dtSpanne.endTime
                               }
                        },
                        {
                           DATUM:
                               {
                                  gte: dtSpanne.startDate,
                                  lte: dtSpanne.endDate
                               }
                        }
                     ]
                  }
               ]
         }
      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.operRooster.count({where: where});
      }
      const objs = await this.dbService.operRooster.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperRoosterOrderByWithRelationInput>(params.SORT ?? "DATUM"),
         take: params.MAX,
         skip: params.START});

      return this.buildGetObjectsResponse(objs, count, params.HASH);
   }

   async AddObject(data: Prisma.OperRoosterCreateInput): Promise<OperRooster>
   {
      const obj = await this.dbService.operRooster.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.OperRoosterUpdateInput): Promise<OperRooster>
   {
      const db = await this.GetObject(id);
      const obj = await this.dbService.operRooster.update({
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
      await this.dbService.operRooster.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db);
   }
}
