import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma} from '@prisma/client';
import {GetObjectsRefTypesRequest} from "./GetObjectsRefTypesRequest";
import {GetRefTypesResponse} from "./GetRefTypesResponse";
import {GetObjectsOperBrandstofRequest} from "../brandstof/GetObjectsOperBrandstofRequest";
import {safeStringify} from "../../core/helpers/LogHelper";

@Injectable()
export class TypesService extends IHeliosService
{
   private readonly logger = new Logger(TypesService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number, relation :string = undefined): Promise<GetRefTypesResponse>
   {
      this.logger.verbose(`TypesService.GetObject(${safeStringify({id, relation})})`);
      const db = await this.dbService.refType.findUnique({
         where: {
            ID: id
         },
         include: this.SelectStringToInclude<Prisma.RefTypeInclude>(relation)
      });
      if (!db)
         throw new HttpException(`Type record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);

      const result = new GetRefTypesResponse(db);
      this.logger.verbose(`TypesService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsRefTypesRequest): Promise<IHeliosGetObjectsResponse<GetRefTypesResponse>>
   {
      this.logger.verbose(`TypesService.GetObjects(${safeStringify({params})})`);
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
            { GROEP: params.GROEP},
         ]
      }
      let count;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.refType.count({where: where});
      }
      const objs = await this.dbService.refType.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.RefTypeOrderByWithRelationInput>(params.SORT ?? "GROEP, SORTEER_VOLGORDE, ID"),
         take: params.MAX,
         skip: params.START,
         include: {
            TypesGroep: true
         }
      });

      const response = objs.map((obj) => new GetRefTypesResponse(obj));
      const result = this.buildGetObjectsResponse(response, count, params.HASH);
      this.logger.verbose(`TypesService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.RefTypeCreateInput , actorId: number): Promise<GetRefTypesResponse>
   {
      this.logger.verbose(`TypesService.AddObject(${safeStringify({data})})`);
      const obj = await this.dbService.refType.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj, actorId);
      const result = new GetRefTypesResponse(obj);
      this.logger.verbose(`TypesService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   async UpdateObject(id: number, data: Prisma.RefTypeUpdateInput, actorId: number): Promise<GetRefTypesResponse>
   {
      this.logger.verbose(`TypesService.UpdateObject(${safeStringify({id, data})})`);
      const db = await this.GetObject(id);
      const obj = await this.dbService.refType.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, data, obj, actorId);

      const result = new GetRefTypesResponse(obj);
      this.logger.verbose(`TypesService.UpdateObject() => ${safeStringify(result)}`);
      return result;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`TypesService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.refType.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name,  id, db, actorId);
   }
}
