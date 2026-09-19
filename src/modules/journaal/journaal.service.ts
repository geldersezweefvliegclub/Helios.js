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
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";
import {RegCall} from "../../core/helpers/RegCall";

// journaal record inclusief de relaties die de PHP journaal_view samenvoegt
type JournaalMetRelaties = Prisma.OperJournaalGetPayload<{
   include: {
      Vliegtuig: true,
      Rollend: true,
      Melder: true,
      Technicus: true,
      Status: true,
      Categorie: true,
      Afgetekend: true,
   }
}>;

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
   async GetObject(id: number): Promise<OperJournaal>
   {
      this.logger.verbose(`JournaalService.GetObject(${safeStringify({id})})`);
      const db = await this.dbService.operJournaal.findUnique({
         where: {
            ID: id
         }
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
         params = MaakGetObjectsRequest(GetObjectsOperJournaalRequest, {VERWIJDERD: false});
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

      const response = await this.MaakGetObjectsResponseDataset(objs);
      const result = this.buildGetObjectsResponse(response, count, params.HASH);
      this.logger.verbose(`JournaalService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   // maak de dataset voor de GetObjects response, inclusief de relaties met andere tabellen
   private async MaakGetObjectsResponseDataset(objs: JournaalMetRelaties[]): Promise<GetObjectsOperJournaalResponse[]>
   {
      this.logger.verbose(`JournaalService.MaakGetObjectsResponseDataset(${safeStringify({objs})})`);
      const result = objs.map((obj) => {
         const {
            Vliegtuig: vliegtuig, Rollend: rollend, Status: status, Categorie: categorie,
            Melder: melder, Technicus: technicus, Afgetekend: afgetekend, ...journaal
         } = obj;

         return {
            ...journaal,
            MELDER: melder?.NAAM ?? null,
            TECHNICUS: technicus?.NAAM ?? null,
            AFGETEKEND: afgetekend?.NAAM ?? null,
            ROLLEND: rollend?.OMSCHRIJVING ?? null,
            STATUS: status?.OMSCHRIJVING ?? null,
            STATUS_CODE: status?.CODE ?? null,
            CATEGORIE: categorie?.OMSCHRIJVING ?? null,
            CATEGORIE_CODE: categorie?.CODE ?? null,
            REG_CALL: vliegtuig === null ? " ()" : RegCall(vliegtuig.REGISTRATIE, vliegtuig.CALLSIGN)
         } as GetObjectsOperJournaalResponse
      });
      this.logger.verbose(`JournaalService.MaakGetObjectsResponseDataset() => ${safeStringify(result)}`);
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
