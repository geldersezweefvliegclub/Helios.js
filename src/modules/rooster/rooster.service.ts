import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma} from "@prisma/client";
import {GetObjectsOperRoosterRequest} from "./GetObjectsOperRoosterRequest";
import {GetObjectsOperRoosterResponse} from "./GetObjectsOperRoosterResponse";
import {OperRoosterDto} from "../../generated/nestjs-dto/operRooster.dto";
import {safeStringify} from "../../core/helpers/LogHelper";
import {parseDateOnly, toDateOnly} from "../../core/helpers/DateOnly";

@Injectable()
export class RoosterService extends IHeliosService
{
   private readonly logger = new Logger(RoosterService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number, relation: string = undefined): Promise<OperRoosterDto>
   {
      this.logger.verbose(`RoosterService.GetObject(${safeStringify({id, relation})})`);
      // relatie wordt meegenomen voor consistentie met andere services, maar wordt niet gebruikt
      const db = await this.dbService.operRooster.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`Rooster record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      const result = db;
      this.logger.verbose(`RoosterService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsOperRoosterRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperRoosterResponse>>
   {
      this.logger.verbose(`RoosterService.GetObjects(${safeStringify({params})})`);
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
         count = await this.dbService.operRooster.count({where: where});
      }
      const objs = await this.dbService.operRooster.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperRoosterOrderByWithRelationInput>(params.SORT ?? "DATUM"),
         take: params.MAX,
         skip: params.START});

      const response = objs.map(obj => ({...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date}));
      const result = this.buildGetObjectsResponse(response, count, params.HASH);
      this.logger.verbose(`RoosterService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.OperRoosterCreateInput): Promise<OperRoosterDto>
   {
      this.logger.verbose(`RoosterService.AddObject(${safeStringify({data})})`);
      data.DATUM = parseDateOnly(data.DATUM as Date | string) as Date;
      const obj = await this.dbService.operRooster.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      const result = {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
      this.logger.verbose(`RoosterService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   async UpdateObject(id: number, data: Prisma.OperRoosterUpdateInput): Promise<OperRoosterDto>
   {
      this.logger.verbose(`RoosterService.UpdateObject(${safeStringify({id, data})})`);
      data.DATUM = parseDateOnly(data.DATUM as Date | string) as Date;
      const db = await this.GetObject(id);
      const obj = await this.dbService.operRooster.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, data, obj);
      const result = {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
      this.logger.verbose(`RoosterService.UpdateObject() => ${safeStringify(result)}`);
      return result;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`RoosterService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.operRooster.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db, actorId);
   }
}
