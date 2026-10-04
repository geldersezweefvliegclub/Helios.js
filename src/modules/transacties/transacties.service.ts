import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperTransactie} from "@prisma/client";
import {GetObjectsOperTransactiesRequest} from "./GetObjectsOperTransactiesRequest";
import {GetObjectsOperTransactiesResponse} from "./GetObjectsOperTransactiesResponse";
import {TransactieResponse} from "./TransactieResponse";
import {safeStringify} from "../../core/helpers/LogHelper";
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";
import {toDateOnly} from "../../core/helpers/TimeDate";

// transactie record inclusief de relaties die de PHP transacties_view samenvoegt
type TransactieMetRelaties = Prisma.OperTransactieGetPayload<{
   include: {
      RefLid: true,
      RefIngevoerd: true,
      TypeTransactie: true,
   }
}>;

@Injectable()
export class TransactiesService extends IHeliosService
{
   private readonly logger = new Logger(TransactiesService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number): Promise<OperTransactie>
   {
      this.logger.verbose(`TransactiesService.GetObject(${safeStringify({id})})`);
      const db = await this.dbService.operTransactie.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`Transactie record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);

      const result = db;
      this.logger.verbose(`TransactiesService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters. Met alleenLidId (bepaald in de controller)
   // worden enkel de transacties van dat lid opgehaald, ongeacht de LID_ID parameter
   async GetObjects(params?: GetObjectsOperTransactiesRequest, alleenLidId?: number): Promise<IHeliosGetObjectsResponse<GetObjectsOperTransactiesResponse>>
   {
      this.logger.verbose(`TransactiesService.GetObjects(${safeStringify({params, alleenLidId})})`);
      if (params === undefined)
         params = MaakGetObjectsRequest(GetObjectsOperTransactiesRequest, {VERWIJDERD: false});

      // anders dan VanTot() kent PHP hier geen standaard periode: zonder DATUM/BEGIN_DATUM/EIND_DATUM worden alle
      // transacties opgehaald, en met alleen BEGIN_DATUM of EIND_DATUM is de andere kant open
      const beginVanDag = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const eindVanDag = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      const datumFilters: Prisma.OperTransactieWhereInput[] = [];
      if (params.DATUM)
         datumFilters.push({DATUM: {gte: beginVanDag(params.DATUM), lte: eindVanDag(params.DATUM)}});
      if (params.BEGIN_DATUM)
         datumFilters.push({DATUM: {gte: beginVanDag(params.BEGIN_DATUM)}});
      if (params.EIND_DATUM)
         datumFilters.push({DATUM: {lte: eindVanDag(params.EIND_DATUM)}});

      const where: Prisma.OperTransactieWhereInput =
         {
            AND:
               [
                  { ID: params.ID},
                  { LID_ID: params.LID_ID},
                  { VERWIJDERD: params.VERWIJDERD ?? false},
                  { ID: { in: params.IDs }},
                  { EXT_REF: params.EXT_REF},
                  { VLIEGDAG: params.VLIEGDAG},
                  { LID_ID: alleenLidId },
                  ...datumFilters,
               ]
         }

      // net als PHP standaard gesorteerd op ID en maximaal 5000 records; totaal is altijd het volledige aantal
      const count = await this.dbService.operTransactie.count({where: where});
      const objs = await this.dbService.operTransactie.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperTransactieOrderByWithRelationInput>(params.SORT ?? "ID"),
         take: params.MAX ?? 5000,
         skip: params.START,
         include: {
            RefLid: true,
            RefIngevoerd: true,
            TypeTransactie: true
         }
      });

      const dataset = await this.MaakGetObjectsResponseDataset(objs);
      const result = this.buildGetObjectsResponse(dataset, count, params.HASH);
      this.logger.verbose(`TransactiesService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.OperTransactieUncheckedCreateInput, actorId: number): Promise<OperTransactie>
   {
      this.logger.verbose(`TransactiesService.AddObject(${safeStringify({data})})`);
      const obj = await this.dbService.operTransactie.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj, actorId);
      this.logger.verbose(`TransactiesService.AddObject() => ${safeStringify(obj)}`);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.OperTransactieUncheckedUpdateInput, actorId: number): Promise<OperTransactie>
   {
      this.logger.verbose(`TransactiesService.UpdateObject(${safeStringify({id, data})})`);
      const db = await this.GetObject(id);
      const obj = await this.dbService.operTransactie.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, data, obj, actorId);
      this.logger.verbose(`TransactiesService.UpdateObject() => ${safeStringify(obj)}`);
      return obj;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`TransactiesService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.operTransactie.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db, actorId);
   }

   // zet een transactie om naar de API response: VLIEGDAG als kalenderdatum en BEDRAG, SALDO_VOOR en SALDO_NA als
   // getal in plaats van Prisma Decimal, zie RecordToOutput() in class.Transacties.inc.php
   MaakTransactieResponse(obj: OperTransactie): TransactieResponse
   {
      return {
         ...obj,
         VLIEGDAG: toDateOnly(obj.VLIEGDAG) as unknown as Date,
         BEDRAG: obj.BEDRAG === null ? null : obj.BEDRAG.toNumber(),
         SALDO_VOOR: obj.SALDO_VOOR === null ? null : obj.SALDO_VOOR.toNumber(),
         SALDO_NA: obj.SALDO_NA === null ? null : obj.SALDO_NA.toNumber(),
      };
   }

   // maak de dataset voor de GetObjects response, inclusief de relaties met andere tabellen
   private async MaakGetObjectsResponseDataset(objs: TransactieMetRelaties[]): Promise<GetObjectsOperTransactiesResponse[]>
   {
      this.logger.verbose(`TransactiesService.MaakGetObjectsResponseDataset(${safeStringify({objs})})`);
      const result = objs.map((obj) => {
         const {RefLid: lid, RefIngevoerd: ingevoerd, TypeTransactie: typeTransactie, ...transactie} = obj;

         return {
            ...this.MaakTransactieResponse(transactie),
            NAAM: lid?.NAAM ?? null,
            INGEVOERD: ingevoerd?.NAAM ?? null,
            TYPE: typeTransactie?.OMSCHRIJVING ?? null,
         } as GetObjectsOperTransactiesResponse;
      });
      this.logger.verbose(`TransactiesService.MaakGetObjectsResponseDataset() => ${safeStringify(result)}`);
      return result;
   }
}
