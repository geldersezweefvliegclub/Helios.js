import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperJournaal} from "@prisma/client";
import {GetObjectsOperJournaalRequest} from "./GetObjectsOperJournaalRequest";
import {GetObjectsOperJournaalResponse} from "./GetObjectsOperJournaalResponse";
import {safeStringify} from "../../core/helpers/LogHelper";

@Injectable()
export class JournaalService extends IHeliosService
{
   private readonly logger = new Logger(JournaalService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number, relation:string = undefined): Promise<OperJournaal>
   {
      this.logger.verbose(`JournaalService.GetObject(${safeStringify({id, relation})})`);
      const db = await this.dbService.operJournaal.findUnique({
         where: {
            ID: id
         },
         include: this.SelectStringToInclude<Prisma.OperJournaalInclude>(relation)
      });
      if (!db)
         throw new HttpException(`Journaal record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      const result = db;
      this.logger.verbose(`JournaalService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsOperJournaalRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperJournaalResponse>>
   {
      this.logger.verbose(`JournaalService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
      {
         params = new GetObjectsOperJournaalRequest();
         params.VERWIJDERD = false;
      }
      const dtSpanne = params.VanTot(params.DATUM, params.BEGIN_DATUM, params.EIND_DATUM);
      const where: Prisma.OperJournaalWhereInput =
         {
            AND:
               [
                  { ID: params.ID },
                  { VERWIJDERD: params.VERWIJDERD ?? false },
                  { ID: { in: params.IDs }},
                  { OR: [
                        { TITEL: { contains: params.SELECTIE }},
                        { OMSCHRIJVING: { contains: params.SELECTIE }},
                        { Melder: { NAAM: { contains: params.SELECTIE }}},
                        { Rollend: { OMSCHRIJVING: { contains: params.SELECTIE }}},
                        { Vliegtuig: { REGISTRATIE: { contains: params.SELECTIE }}},
                        { Vliegtuig: { CALLSIGN: { contains: params.SELECTIE }}},
                     ]
                  },
                  { MELDER_ID: { in: params.MELDER_ID }},
                  { TECHNICUS_ID: { in: params.TECHNICUS_ID }},
                  { STATUS_ID: { in: params.STATUS_ID }},
                  { CATEGORIE_ID: { in: params.CATEGORIE_ID }},
                  { ROLLEND_ID: params.ROLLEND === undefined ? undefined : (params.ROLLEND ? {not: null} : null)},
                  { VLIEGTUIG_ID: params.VLIEGEND === undefined ? undefined : (params.VLIEGEND ? {not: null} : null)},
                  { VLIEGTUIG_ID: { in: params.VLIEGTUIG_ID }},

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
         };

      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.operJournaal.count({ where: where });
      }
      const objs = await this.dbService.operJournaal.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperJournaalOrderByWithRelationInput>(params.SORT ?? "STATUS_ID, DATUM DESC"),
         take: params.MAX,
         skip: params.START,
         include: {
            Vliegtuig: true,
            Rollend: true,
            Melder: true,
            Technicus: true,
            Status: true,
            Categorie: true,
            Afgetekend: true
         },
      });

      const response = objs.map((obj) => {
         // kopieer relevante velden van child objects naar het parent object
         const retObj = {
            ...obj,
            MELDER: obj.Melder?.NAAM ?? null,
            TECHNICUS: obj.Technicus?.NAAM ?? null,
            AFGETEKEND: obj.Afgetekend?.NAAM ?? null,
            ROLLEND: obj.Rollend?.OMSCHRIJVING ?? null,
            STATUS: obj.Status?.OMSCHRIJVING ?? null,
            STATUS_CODE: obj.Status?.CODE ?? null,
            CATEGORIE: obj.Categorie?.OMSCHRIJVING ?? null,
            CATEGORIE_CODE: obj.Categorie?.CODE ?? null,
            REG_CALL: obj.Vliegtuig === null ? " ()" : obj.Vliegtuig?.REGISTRATIE + (obj.Vliegtuig?.CALLSIGN ?  " (" + obj.Vliegtuig.CALLSIGN + ")" : "")
         } ;

         // verwijder child objects uit de response
         delete retObj.Vliegtuig;
         delete retObj.Rollend;
         delete retObj.Status;
         delete retObj.Categorie;
         delete retObj.Melder;
         delete retObj.Technicus;
         delete retObj.Afgetekend

         return  retObj as GetObjectsOperJournaalResponse
      });
      const result = this.buildGetObjectsResponse(response, count, params.HASH);
      this.logger.verbose(`JournaalService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.OperJournaalUncheckedCreateInput, actorId: number): Promise<OperJournaal>
   {
      this.logger.verbose(`JournaalService.AddObject(${safeStringify({data})})`);
      const obj = await this.dbService.operJournaal.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj, actorId);
      const result = obj;
      this.logger.verbose(`JournaalService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   async UpdateObject(id: number, data: Prisma.OperJournaalUncheckedUpdateInput, actorId: number): Promise<OperJournaal>
   {
      this.logger.verbose(`JournaalService.UpdateObject(${safeStringify({id, data})})`);
      const db = await this.GetObject(id);
      const obj = await this.dbService.operJournaal.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id, db, data, obj, actorId);
      const result = obj;
      this.logger.verbose(`JournaalService.UpdateObject() => ${safeStringify(result)}`);
      return result;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`JournaalService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.operJournaal.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name,  id, db, actorId);
   }
}
