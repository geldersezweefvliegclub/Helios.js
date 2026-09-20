import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperTransactie} from "@prisma/client";
import {GetObjectsOperTransactiesRequest} from "./GetObjectsOperTransactiesRequest";
import {GetObjectsOperTransactiesResponse} from "./GetObjectsOperTransactiesResponse";
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

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsOperTransactiesRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperTransactiesResponse>>
   {
      this.logger.verbose(`TransactiesService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
         params = MaakGetObjectsRequest(GetObjectsOperTransactiesRequest, {VERWIJDERD: false});
      const dtSpanne = params.VanTot(params.DATUM, params.BEGIN_DATUM, params.EIND_DATUM);
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
         count = await this.dbService.operTransactie.count({where: where});
      }
      const objs = await this.dbService.operTransactie.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperTransactieOrderByWithRelationInput>(params.SORT ?? "DATUM"),
         take: params.MAX,
         skip: params.START,
         include: {
            RefLid: true,
            RefIngevoerd: true,
            TypeTransactie: true
         }
      });

      const response = await this.MaakGetObjectsResponseDataset(objs);

      const result = this.buildGetObjectsResponse(response, count, params.HASH);
      this.logger.verbose(`TransactiesService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   // maak de dataset voor de GetObjects response, inclusief de relaties met andere tabellen
   private async MaakGetObjectsResponseDataset(objs: TransactieMetRelaties[]): Promise<GetObjectsOperTransactiesResponse[]>
   {
      this.logger.verbose(`TransactiesService.MaakGetObjectsResponseDataset(${safeStringify({objs})})`);
      const result = objs.map((obj) => {
         const {RefLid: lid, RefIngevoerd: ingevoerd, TypeTransactie: typeTransactie, ...transactie} = obj;

         return {
            ...transactie,
            VLIEGDAG: toDateOnly(transactie.VLIEGDAG) as unknown as Date,
            NAAM: lid?.NAAM ?? null,
            INGEVOERD: ingevoerd?.NAAM ?? null,
            TYPE: typeTransactie?.OMSCHRIJVING ?? null,
         } as GetObjectsOperTransactiesResponse;
      });
      this.logger.verbose(`TransactiesService.MaakGetObjectsResponseDataset() => ${safeStringify(result)}`);
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
}
