import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma} from "@prisma/client";
import {GetObjectsOperDienstenRequest} from "./GetObjectsOperDienstenRequest";
import {GetOperDienstenResponse} from "./GetOperDienstenResponse";
import {safeStringify} from "../../core/helpers/LogHelper";
import {parseDateOnly} from "../../core/helpers/DateOnly";

@Injectable()
export class DienstenService extends IHeliosService
{
   private readonly logger = new Logger(DienstenService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number, relation: string = undefined): Promise<GetOperDienstenResponse>
   {
      this.logger.verbose(`DienstenService.GetObject(${safeStringify({id, relation})})`);
      // relatie wordt meegenomen voor consistentie met andere services, maar wordt niet gebruikt
      const db = await this.dbService.operDienst.findUnique({
         where: {
            ID: id
         },
      });

      if (!db) {
         throw new HttpException(`DagRapport record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      }

      const result = new GetOperDienstenResponse(db);
      this.logger.verbose(`DienstenService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsOperDienstenRequest): Promise<IHeliosGetObjectsResponse<GetOperDienstenResponse>>
   {
      this.logger.verbose(`DienstenService.GetObjects(${safeStringify({params})})`);
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
                  { AANWEZIG: params.AANWEZIG },
                  { AFWEZIG: params.AFWEZIG },

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
            TypeDienst: true,
            RefLid: true,
            RefIngevoerd: true
         }
      });

      const objs = rawObjs.map((o) => new GetOperDienstenResponse(o))


      const result = this.buildGetObjectsResponse(objs, count, params.HASH);
      this.logger.verbose(`DienstenService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.OperDienstCreateInput): Promise<GetOperDienstenResponse>
   {
      this.logger.verbose(`DienstenService.AddObject(${safeStringify({data})})`);
      data.DATUM = parseDateOnly(data.DATUM as Date | string) as Date;
      const obj = await this.dbService.operDienst.create({
         data: data,
         include: {
            TypeDienst: true
         }
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      const result = new GetOperDienstenResponse(obj);
      this.logger.verbose(`DienstenService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   async UpdateObject(id: number, data: Prisma.OperDienstUpdateInput): Promise<GetOperDienstenResponse>
   {
      this.logger.verbose(`DienstenService.UpdateObject(${safeStringify({id, data})})`);
      data.DATUM = parseDateOnly(data.DATUM as Date | string) as Date;
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

      const result = new GetOperDienstenResponse(obj);
      this.logger.verbose(`DienstenService.UpdateObject() => ${safeStringify(result)}`);
      return result;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`DienstenService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.operDienst.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db, actorId);
   }
}
