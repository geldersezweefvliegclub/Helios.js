import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperFactuur} from "@prisma/client";
import {GetObjectsOperFacturenRequest} from "./GetObjectsOperFacturenRequest";
import {GetObjectsOperFacturenResponse} from "./GetObjectsOperFacturenResponse";
import {safeStringify} from "../../core/helpers/LogHelper";

@Injectable()
export class FacturenService extends IHeliosService
{
   private readonly logger = new Logger(FacturenService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number, relation: string = undefined): Promise<OperFactuur>
   {
      this.logger.verbose(`FacturenService.GetObject(${safeStringify({id, relation})})`);
      // relatie wordt meegenomen voor consistentie met andere services, maar wordt niet gebruikt
      const db = await this.dbService.operFactuur.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`Factuur record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      const result = db;
      this.logger.verbose(`FacturenService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsOperFacturenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperFacturenResponse>>
   {
      this.logger.verbose(`FacturenService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
      {
         params = new GetObjectsOperFacturenRequest();
         params.VERWIJDERD = false;
      }
      const where: Prisma.OperFactuurWhereInput =
         {
            AND:
               [
                  { ID: params.ID},
                  { VERWIJDERD: params.VERWIJDERD ?? false},
                  { ID: { in: params.IDs }},
                  { LID_ID: { in: params.LID_ID }},
                  { JAAR: params.JAAR },
                  {
                     OR: [
                        { NAAM:           { contains: params.SELECTIE }},
                        { FACTUUR_NUMMER: { contains: params.SELECTIE }},
                        { OMSCHRIJVING:   { contains: params.SELECTIE }},
                        { LIDNR:          { contains: params.SELECTIE }}
                     ]
                  }
               ]
         }
      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.operFactuur.count({where: where});
      }
      const objs = await this.dbService.operFactuur.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperFactuurOrderByWithRelationInput>(params.SORT ?? "ID"),
         take: params.MAX,
         skip: params.START});

      const result = this.buildGetObjectsResponse(objs, count, params.HASH);
      this.logger.verbose(`FacturenService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.OperFactuurCreateInput): Promise<OperFactuur>
   {
      this.logger.verbose(`FacturenService.AddObject(${safeStringify({data})})`);
      const obj = await this.dbService.operFactuur.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      const result = obj;
      this.logger.verbose(`FacturenService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   async UpdateObject(id: number, data: Prisma.OperFactuurUpdateInput): Promise<OperFactuur>
   {
      this.logger.verbose(`FacturenService.UpdateObject(${safeStringify({id, data})})`);
      const db = await this.GetObject(id);
      const obj = await this.dbService.operFactuur.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, data, obj);
      const result = obj;
      this.logger.verbose(`FacturenService.UpdateObject() => ${safeStringify(result)}`);
      return result;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`FacturenService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.operFactuur.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db, actorId);
   }
}
