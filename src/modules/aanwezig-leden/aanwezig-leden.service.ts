import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperAanwezigLid, RefLid} from "@prisma/client";
import {GetObjectsOperAanwezigLedenRequest} from "./GetObjectsOperAanwezigLedenRequest";
import {GetObjectsOperAanwezigLedenResponse} from "./GetObjectsOperAanwezigLedenResponse";

@Injectable()
export class AanwezigLedenService extends IHeliosService
{
   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   async GetObject(id: number, relation: string = undefined): Promise<OperAanwezigLid>
   {
      // relation is included for consistency with other services, but not used
      const db = await this.dbService.operAanwezigLid.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`AanwezigLid record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      return db;
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params?: GetObjectsOperAanwezigLedenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperAanwezigLedenResponse>>
   {
      if (params === undefined)
      {
         params = new GetObjectsOperAanwezigLedenRequest();
         params.VERWIJDERD = false;
      }
      const dtSpanne = params.VanTot(params.DATUM, params.BEGIN_DATUM, params.EIND_DATUM);
      const where: Prisma.OperAanwezigLidWhereInput =
          {
             AND:
                 [
                    {ID: params.ID},
                    {VERWIJDERD: params.VERWIJDERD ?? false},
                    {ID: {in: params.IDs}},

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
         count = await this.dbService.operAanwezigLid.count({where: where});
      }
      const objs = await this.dbService.operAanwezigLid.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperAanwezigLidOrderByWithRelationInput>(params.SORT ?? "DATUM"),
         take: params.MAX,
         skip: params.START});

      return this.buildGetObjectsResponse(objs, count, params.HASH);
   }

   async AddObject(data: Prisma.OperAanwezigLidCreateInput): Promise<OperAanwezigLid>
   {
      const obj = await this.dbService.operAanwezigLid.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.OperAanwezigLidUpdateInput): Promise<OperAanwezigLid>
   {
      const db = await this.GetObject(id);
      const obj = await this.dbService.operAanwezigLid.update({
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
      await this.dbService.operAanwezigLid.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db);
   }

   async IsAangemeld(currentUser: RefLid): Promise<boolean> {
      const rec = await this.dbService.operAanwezigLid.findFirst({ where: { LID_ID: currentUser.ID, DATUM: new Date(), VERWIJDERD: false } });
      return !!rec;
   }
}
