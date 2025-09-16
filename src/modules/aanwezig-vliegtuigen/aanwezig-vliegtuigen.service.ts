import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperAanwezigVliegtuig} from "@prisma/client";
import {GetObjectsOperAanwezigVliegtuigenRequest} from "./GetObjectsOperAanwezigVliegtuigenRequest";
import {GetObjectsOperAanwezigVliegtuigenResponse} from "./GetObjectsOperAanwezigVliegtuigenResponse";

@Injectable()
export class AanwezigVliegtuigenService extends IHeliosService
{
   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   async GetObject(id: number, relation: string = undefined): Promise<OperAanwezigVliegtuig>
   {
      // relation is included for consistency with other services, but not used
      const db = await this.dbService.operAanwezigVliegtuig.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`AanwezigVliegtuig record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      return db;
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params?: GetObjectsOperAanwezigVliegtuigenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperAanwezigVliegtuigenResponse>>
   {
      if (params === undefined)
      {
         params = new GetObjectsOperAanwezigVliegtuigenRequest();
         params.VERWIJDERD = false;
      }
      const where: Prisma.OperAanwezigVliegtuigWhereInput =
         {
            AND:
               [
                  { ID: params.ID},
                  { VERWIJDERD: params.VERWIJDERD ?? false},
                  { ID: { in: params.IDs }},
                  params.NIET_VERTROKKEN ? { VERTREK: null } : {},
               ]
         }
      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.operAanwezigVliegtuig.count({where: where});
      }
      const objs = await this.dbService.operAanwezigVliegtuig.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperAanwezigVliegtuigOrderByWithRelationInput>(params.SORT ?? "DATUM"),
         take: params.MAX,
         skip: params.START});

      return this.buildGetObjectsResponse(objs, count, params.HASH);
   }

   async AddObject(data: Prisma.OperAanwezigVliegtuigCreateInput): Promise<OperAanwezigVliegtuig>
   {
      const obj = await this.dbService.operAanwezigVliegtuig.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.OperAanwezigVliegtuigUpdateInput): Promise<OperAanwezigVliegtuig>
   {
      const db = await this.GetObject(id);
      const obj = await this.dbService.operAanwezigVliegtuig.update({
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
      await this.dbService.operAanwezigVliegtuig.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db);
   }
}
