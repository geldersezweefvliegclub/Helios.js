import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperJournaal} from "@prisma/client";
import {GetObjectsOperJournaalRequest} from "./GetObjectsOperJournaalRequest";
import {GetObjectsOperJournaalResponse} from "./GetObjectsOperJournaalResponse";

@Injectable()
export class JournaalService extends IHeliosService
{
   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   async GetObject(id: number, relation:string = undefined): Promise<OperJournaal>
   {
      const db = await this.dbService.operJournaal.findUnique({
         where: {
            ID: id
         },
         include: this.SelectStringToInclude<Prisma.OperJournaalInclude>(relation)
      });
      if (!db)
         throw new HttpException(`Journaal record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      return db;
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params?: GetObjectsOperJournaalRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperJournaalResponse>>
   {
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
                  { VLIEGTUIG_ID: { in: params.VLIEGTUIG_ID }},

                  {
                     OR: [
                        {
                           DATUM:
                              {
                                 gte: dtSpanne.startTime,
                                 lte: dtSpanne.endTime
                              }
                        },
                        {
                           DATUM:
                              {
                                 gte: dtSpanne.startDate,
                                 lte: dtSpanne.endDate
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
         // copy relevant fields from child objects to the parent object
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

         // delete child objects from the response
         delete retObj.Vliegtuig;
         delete retObj.Rollend;
         delete retObj.Status;
         delete retObj.Categorie;
         delete retObj.Melder;
         delete retObj.Technicus;
         delete retObj.Afgetekend

         return  retObj as GetObjectsOperJournaalResponse
      });
      return this.buildGetObjectsResponse(response, count, params.HASH);
   }

   async AddObject(data: Prisma.OperJournaalCreateInput ): Promise<OperJournaal>
   {
      const obj = await this.dbService.operJournaal.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.OperJournaalUpdateInput): Promise<OperJournaal>
   {
      const db = await this.GetObject(id);
      const obj = await this.dbService.operJournaal.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id, db, data, obj);
      return obj;
   }

   async RemoveObject(id: number): Promise<void>
   {
      const db = await this.GetObject(id);
      await this.dbService.operJournaal.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name,  id, db);
   }
}
