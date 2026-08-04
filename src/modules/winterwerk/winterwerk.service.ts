import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperWinterwerk} from "@prisma/client";
import {GetObjectsOperWinterwerkRequest} from "./GetObjectsOperWinterwerkRequest";
import {GetObjectsOperWinterwerkResponse} from "./GetObjectsOperWinterwerkResponse";
import {safeStringify} from "../../core/helpers/LogHelper";
import {parseDateOnly, parseTimeOnly, toDateOnly, toTimeOnly} from "../../core/helpers/DateOnly";

@Injectable()
export class WinterwerkService extends IHeliosService
{
   private readonly logger = new Logger(WinterwerkService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number, relation: string = undefined): Promise<OperWinterwerk>
   {
      this.logger.verbose(`WinterwerkService.GetObject(${safeStringify({id, relation})})`);
      // relatie wordt meegenomen voor consistentie met andere services, maar wordt niet gebruikt
      const db = await this.dbService.operWinterwerk.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`Winterwerk record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      const result = db;
      this.logger.verbose(`WinterwerkService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsOperWinterwerkRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperWinterwerkResponse>>
   {
      this.logger.verbose(`WinterwerkService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
      {
         params = new GetObjectsOperWinterwerkRequest();
         params.VERWIJDERD = false;
      }
      const where: Prisma.OperWinterwerkWhereInput =
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
         count = await this.dbService.operWinterwerk.count({where: where});
      }
      const objs = await this.dbService.operWinterwerk.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperWinterwerkOrderByWithRelationInput>(params.SORT ?? "DATUM"),
         take: params.MAX,
         skip: params.START});

      const response = objs.map(obj => ({
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         AANVANG: toTimeOnly(obj.AANVANG) as unknown as Date,
         EINDE: toTimeOnly(obj.EINDE) as unknown as Date,
      }));
      const result = this.buildGetObjectsResponse(response, count, params.HASH);
      this.logger.verbose(`WinterwerkService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.OperWinterwerkCreateInput): Promise<OperWinterwerk>
   {
      this.logger.verbose(`WinterwerkService.AddObject(${safeStringify({data})})`);
      data.DATUM = parseDateOnly(data.DATUM as Date | string) as Date;
      data.AANVANG = parseTimeOnly(data.AANVANG as Date | string) as Date;
      data.EINDE = parseTimeOnly(data.EINDE as Date | string) as Date;

      const obj = await this.dbService.operWinterwerk.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      const result = {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         AANVANG: toTimeOnly(obj.AANVANG) as unknown as Date,
         EINDE: toTimeOnly(obj.EINDE) as unknown as Date,
      };
      this.logger.verbose(`WinterwerkService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   async UpdateObject(id: number, data: Prisma.OperWinterwerkUpdateInput): Promise<OperWinterwerk>
   {
      this.logger.verbose(`WinterwerkService.UpdateObject(${safeStringify({id, data})})`);
      data.DATUM = parseDateOnly(data.DATUM as Date | string) as Date;
      data.AANVANG = parseTimeOnly(data.AANVANG as Date | string) as Date;
      data.EINDE = parseTimeOnly(data.EINDE as Date | string) as Date;

      const db = await this.GetObject(id);
      const obj = await this.dbService.operWinterwerk.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, data, obj);
      const result = {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         AANVANG: toTimeOnly(obj.AANVANG) as unknown as Date,
         EINDE: toTimeOnly(obj.EINDE) as unknown as Date,
      };
      this.logger.verbose(`WinterwerkService.UpdateObject() => ${safeStringify(result)}`);
      return result;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`WinterwerkService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.operWinterwerk.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db, actorId);
   }
}
