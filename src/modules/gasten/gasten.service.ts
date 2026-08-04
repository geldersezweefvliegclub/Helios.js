import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperGast} from "@prisma/client";
import {GetObjectsOperGastenRequest} from "./GetObjectsOperGastenRequest";
import {GetObjectsOperGastenResponse} from "./GetObjectsOperGastenResponse";
import {safeStringify} from "../../core/helpers/LogHelper";
import {parseDateOnly, toDateOnly} from "../../core/helpers/DateOnly";

@Injectable()
export class GastenService extends IHeliosService
{
   private readonly logger = new Logger(GastenService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number, relation: string = undefined): Promise<OperGast>
   {
      this.logger.verbose(`GastenService.GetObject(${safeStringify({id, relation})})`);
      // relatie wordt meegenomen voor consistentie met andere services, maar wordt niet gebruikt
      const db = await this.dbService.operGast.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`Gast record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      const result = db;
      this.logger.verbose(`GastenService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsOperGastenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperGastenResponse>>
   {
      this.logger.verbose(`GastenService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
      {
         params = new GetObjectsOperGastenRequest();
         params.VERWIJDERD = false;
      }
      const where: Prisma.OperGastWhereInput =
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
         count = await this.dbService.operGast.count({where: where});
      }
      const rawObjs = await this.dbService.operGast.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperGastOrderByWithRelationInput>(params.SORT ?? "DATUM"),
         take: params.MAX,
         skip: params.START,
         include: {
            Veld: true
         }
      });

      const objs = rawObjs.map((obj) => {
         const retObj = {
            ...obj,
            DATUM: toDateOnly(obj.DATUM) as unknown as Date,
            VELD: obj.Veld?.OMSCHRIJVING ?? null,
         };

         delete retObj.Veld;

         return retObj as GetObjectsOperGastenResponse;
      });

      const result = this.buildGetObjectsResponse(objs, count, params.HASH);
      this.logger.verbose(`GastenService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.OperGastCreateInput): Promise<OperGast>
   {
      this.logger.verbose(`GastenService.AddObject(${safeStringify({data})})`);
      // VERWIJDERD en LAATSTE_AANPASSING zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      data.DATUM = parseDateOnly(data.DATUM as Date | string) as Date;
      const obj = await this.dbService.operGast.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      const result = {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
      this.logger.verbose(`GastenService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   async UpdateObject(id: number, data: Prisma.OperGastUpdateInput): Promise<OperGast>
   {
      this.logger.verbose(`GastenService.UpdateObject(${safeStringify({id, data})})`);
      // VERWIJDERD en LAATSTE_AANPASSING zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete (data as {ID?: number}).ID;
      data.DATUM = parseDateOnly(data.DATUM as Date | string) as Date;
      const db = await this.GetObject(id);
      const obj = await this.dbService.operGast.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, data, obj);
      const result = {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
      this.logger.verbose(`GastenService.UpdateObject() => ${safeStringify(result)}`);
      return result;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`GastenService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.operGast.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db, actorId);
   }
}
