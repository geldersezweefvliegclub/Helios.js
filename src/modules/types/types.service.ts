import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, RefType} from '@prisma/client';
import {GetObjectsRefTypesRequest} from "./GetObjectsRefTypesRequest";
import {GetObjectsRefTypesResponse} from "./GetObjectsRefTypesResponse";
import {GetObjectsOperBrandstofRequest} from "../brandstof/GetObjectsOperBrandstofRequest";
import {RefTypeDto} from "../../generated/nestjs-dto/refType.dto";

@Injectable()
export class TypesService extends IHeliosService
{
   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   async GetObject(id: number, relation :string = undefined): Promise<RefTypeDto>
   {
      const db = await this.dbService.refType.findUnique({
         where: {
            ID: id
         },
         include: this.SelectStringToInclude<Prisma.RefTypeInclude>(relation)
      });
      if (!db)
         throw new HttpException(`Type record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      return new RefTypeDto(db);
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params?: GetObjectsRefTypesRequest): Promise<IHeliosGetObjectsResponse<GetObjectsRefTypesResponse>>
   {
      if (params === undefined)
      {
         params = new GetObjectsOperBrandstofRequest();
         params.VERWIJDERD = false;
      }
      const where: Prisma.RefTypeWhereInput =
      {
         AND:
         [
            { ID: params.ID},
            { VERWIJDERD: params.VERWIJDERD ?? false},
            { ID: { in: params.IDs }},
            { TYPEGROEP_ID: params.GROEP},
         ]
      }
      let count;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.refType.count({where: where});
      }
      const objs = await this.dbService.refType.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.RefTypeOrderByWithRelationInput>(params.SORT ?? "TYPEGROEP_ID, SORTEER_VOLGORDE, ID"),
         take: params.MAX,
         skip: params.START,
         include: {
            TypesGroep: true
         }
      });

      const response = objs.map((obj) => new RefTypeDto(obj));
      return this.buildGetObjectsResponse(response, count, params.HASH);
   }

   async AddObject(data: Prisma.RefTypeCreateInput ): Promise<RefTypeDto>
   {
      const obj = await this.dbService.refType.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      return new RefTypeDto(obj);
   }

   async UpdateObject(id: number, data: Prisma.RefTypeUpdateInput): Promise<RefTypeDto>
   {
      const db = await this.GetObject(id);
      const obj = await this.dbService.refType.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, data, obj);

      return new RefTypeDto(obj);
   }

   async RemoveObject(id: number): Promise<void>
   {
      const db = await this.GetObject(id);
      await this.dbService.refType.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name,  id, db);
   }
}
