import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, RefTypesGroep} from '@prisma/client';
import {GetObjectsRefTypesGroepenRequest} from "./GetObjectsRefTypesGroepenRequest";
import {GetObjectsRefTypesGroepenResponse} from "./GetObjectsRefTypesGroepenResponse";

export type OptionalKeysOf<Obj> = keyof {
   [Key
      in keyof Obj
      as Omit<Obj, Key> extends Obj ? Key : never
   ]: Obj[Key];
};


@Injectable()
export class TypesGroepenService extends IHeliosService
{
   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   async GetObject(id: number, relation: string = undefined): Promise<RefTypesGroep>
   {
      const db = await this.dbService.refTypesGroep.findUnique({
         where: {
            ID: id
         },
         include: this.SelectStringToInclude<Prisma.RefTypesGroepInclude>(relation)
      });
      if (!db)
         throw new HttpException(`Typegroep record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      return db;
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params?: GetObjectsRefTypesGroepenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsRefTypesGroepenResponse>>
   {
      if (params === undefined)
      {
         params = new GetObjectsRefTypesGroepenRequest();
         params.VERWIJDERD = false;
      }
      const where: Prisma.RefTypesGroepWhereInput =
         {
            AND:
               [
                  { ID: params.ID},
                  { VERWIJDERD: params.VERWIJDERD ?? false},
                  { ID: { in: params.IDs }}
               ]
         }
      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.refTypesGroep.count({where: where});
      }
      const objs = await this.dbService.refTypesGroep.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.RefTypesGroepOrderByWithRelationInput>(params.SORT ?? "SORTEER_VOLGORDE, ID"),
         take: params.MAX,
         skip: params.START
      });
      return this.buildGetObjectsResponse(objs, count, params.HASH);
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
      const db = await this.GetObject(id);
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
      const db = await this.GetObject(id);
      await this.dbService.refTypesGroep.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name,  id, db);
   }
}
