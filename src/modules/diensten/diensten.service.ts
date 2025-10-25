import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma} from "@prisma/client";
import {GetObjectsOperDienstenRequest} from "./GetObjectsOperDienstenRequest";
import {GetObjectsOperDienstenResponse} from "./GetObjectsOperDienstenResponse";
import {OperDienstDto} from "../../generated/nestjs-dto/operDienst.dto";

@Injectable()
export class DienstenService extends IHeliosService
{
   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   async GetObject(id: number, relation: string = undefined): Promise<OperDienstDto>
   {
      // relation is included for consistency with other services, but not used
      const db = await this.dbService.operDienst.findUnique({
         where: {
            ID: id
         },
         include: {
            TypeDienst: true
         }
      });

      if (!db) {
         throw new HttpException(`DagRapport record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      }

      return new OperDienstDto(db);
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params?: GetObjectsOperDienstenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperDienstenResponse>>
   {
      if (params === undefined)
      {
         params = new GetObjectsOperDienstenRequest();
         params.VERWIJDERD = false;
      }

      const dtSpanne = params.VanTot(params.DATUM, params.BEGIN_DATUM, params.EIND_DATUM);
      const where: Prisma.OperDienstWhereInput =
         {
            AND:
               [
                  { ID: params.ID},
                  { VERWIJDERD: params.VERWIJDERD ?? false},
                  { ID: { in: params.IDs }},
                  { LID_ID: params.LID_ID },

                  {
                     OR: [
                        {
                           DATUM:
                               {
                                  gte: dtSpanne.start,
                                  lte: dtSpanne.eind
                               }
                        }
                     ]
                  }
               ]
         }
      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.operDienst.count({where: where});
      }
      const rawObjs = await this.dbService.operDienst.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperDienstOrderByWithRelationInput>(params.SORT ?? "DATUM"),
         take: params.MAX,
         skip: params.START,
         include: {
            TypeDienst: true
         }
      });

      const objs = rawObjs.map((o) => new OperDienstDto(o))


      return this.buildGetObjectsResponse(objs, count, params.HASH);
   }

   async AddObject(data: Prisma.OperDienstCreateInput): Promise<OperDienstDto>
   {
      const obj = await this.dbService.operDienst.create({
         data: data,
         include: {
            TypeDienst: true
         }
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      return new OperDienstDto(obj);
   }

   async UpdateObject(id: number, data: Prisma.OperDienstUpdateInput): Promise<OperDienstDto>
   {
      const db = await this.GetObject(id);
      const obj = await this.dbService.operDienst.update({
         where: {
            ID: id
         },
         data: data,
         include: {
            TypeDienst: true
         }
      });

      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, data, obj);

      return new OperDienstDto(obj);
   }

   async RemoveObject(id: number): Promise<void>
   {
      const db = await this.GetObject(id);
      await this.dbService.operDienst.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db);
   }
}
