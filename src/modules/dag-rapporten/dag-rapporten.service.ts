import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperDagRapport} from "@prisma/client";
import {GetObjectsOperDagRapportenRequest} from "./GetObjectsOperDagRapportenRequest";
import {GetObjectsOperDagRapportenResponse} from "./GetObjectsOperDagRapportenResponse";
import {safeStringify} from "../../core/helpers/LogHelper";
import {parseDateOnly, toDateOnly} from "../../core/helpers/DateOnly";

@Injectable()
export class DagRapportenService extends IHeliosService
{
   private readonly logger = new Logger(DagRapportenService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number, relation: string = undefined): Promise<OperDagRapport>
   {
      this.logger.verbose(`DagRapportenService.GetObject(${safeStringify({id, relation})})`);
      // relatie wordt meegenomen voor consistentie met andere services, maar wordt niet gebruikt
      const db = await this.dbService.operDagRapport.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`DagRapport record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      const result = db;
      this.logger.verbose(`DagRapportenService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsOperDagRapportenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperDagRapportenResponse>>
   {
      this.logger.verbose(`DagRapportenService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
      {
         params = new GetObjectsOperDagRapportenRequest();
         params.VERWIJDERD = false;
      }
      const dtSpanne = params.VanTot(params.DATUM, params.BEGIN_DATUM, params.EIND_DATUM);
      const where: Prisma.OperDagRapportWhereInput =
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
         count = await this.dbService.operDagRapport.count({where: where});
      }
      const objs = await this.dbService.operDagRapport.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperDagRapportOrderByWithRelationInput>(params.SORT ?? "DATUM"),
         take: params.MAX,
         skip: params.START,
         include: {
            Veld: true,
            RefLid: true,
         }
      });

      const response = objs.map((obj) => {
         const {Veld: veld, RefLid: lid, ...dagRapport} = obj;
         return {
            ...dagRapport,
            DATUM: toDateOnly(dagRapport.DATUM) as unknown as Date,
            INGEVOERD: lid.NAAM,
            VELD_CODE: veld.CODE,
            VELD_OMS: veld.OMSCHRIJVING,
         } as GetObjectsOperDagRapportenResponse;
      });

      const result = this.buildGetObjectsResponse(response, count, params.HASH);
      this.logger.verbose(`DagRapportenService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.OperDagRapportCreateInput): Promise<OperDagRapport>
   {
      this.logger.verbose(`DagRapportenService.AddObject(${safeStringify({data})})`);
      // VERWIJDERD en LAATSTE_AANPASSING zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      data.DATUM = parseDateOnly(data.DATUM as Date | string) as Date;
      const obj = await this.dbService.operDagRapport.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      const result = {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
      this.logger.verbose(`DagRapportenService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   async UpdateObject(id: number, data: Prisma.OperDagRapportUpdateInput): Promise<OperDagRapport>
   {
      this.logger.verbose(`DagRapportenService.UpdateObject(${safeStringify({id, data})})`);
      // VERWIJDERD en LAATSTE_AANPASSING zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete (data as {ID?: number}).ID;
      data.DATUM = parseDateOnly(data.DATUM as Date | string) as Date;
      const db = await this.GetObject(id);
      const obj = await this.dbService.operDagRapport.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, data, obj);
      const result = {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
      this.logger.verbose(`DagRapportenService.UpdateObject() => ${safeStringify(result)}`);
      return result;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`DagRapportenService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.operDagRapport.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db, actorId);
   }
}
