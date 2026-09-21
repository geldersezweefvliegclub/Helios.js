import {HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, RefCompetentie} from "@prisma/client";
import {GetObjectsRefCompetentiesRequest} from "./GetObjectsRefCompetentiesRequest";
import {GetObjectsRefCompetentiesResponse} from "./GetObjectsRefCompetentiesResponse";
import {safeStringify} from "../../core/helpers/LogHelper";
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";

// competentie record inclusief de relatie die de PHP competenties_view samenvoegt
type CompetentieMetRelaties = Prisma.RefCompetentieGetPayload<{
   include: {
      LeerfaseType: true,
   }
}>;

@Injectable()
export class CompetentiesService extends IHeliosService
{
   private readonly logger = new Logger(CompetentiesService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number): Promise<RefCompetentie>
   {
      this.logger.verbose(`CompetentiesService.GetObject(${safeStringify({id})})`);
      const db = await this.dbService.refCompetentie.findUnique({
         where: {
            ID: id
         }
      });
      if (!db)
         throw new HttpException(`Competentie record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      const result = db;
      this.logger.verbose(`CompetentiesService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsRefCompetentiesRequest): Promise<IHeliosGetObjectsResponse<GetObjectsRefCompetentiesResponse>>
   {
      this.logger.verbose(`CompetentiesService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
         params = MaakGetObjectsRequest(GetObjectsRefCompetentiesRequest, {VERWIJDERD: false});
      const where: Prisma.RefCompetentieWhereInput =
         {
            AND:
               [
                  { ID: params.ID },
                  { VERWIJDERD: params.VERWIJDERD ?? false },
                  { ID: { in: params.IDs }},
                  { LEERFASE_ID: params.LEERFASE_ID}
               ]
         }
      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.refCompetentie.count({ where: where });
      }
      const objs = await this.dbService.refCompetentie.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.RefCompetentieOrderByWithRelationInput>(params.SORT ?? "VOLGORDE, ID"),
         take: params.MAX,
         skip: params.START,
         include: {
            LeerfaseType: true
         }
      });

      const dataset = await this.MaakGetObjectsResponseDataset(objs);
      const result = this.buildGetObjectsResponse(dataset, count, params.HASH);
      this.logger.verbose(`CompetentiesService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.RefCompetentieUncheckedCreateInput , actorId: number): Promise<RefCompetentie>
   {
      this.logger.verbose(`CompetentiesService.AddObject(${safeStringify({data})})`);
      const obj = await this.dbService.refCompetentie.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj, actorId);
      const result = obj;
      this.logger.verbose(`CompetentiesService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   async UpdateObject(id: number, data: Prisma.RefCompetentieUncheckedUpdateInput, actorId: number): Promise<RefCompetentie>
   {
      this.logger.verbose(`CompetentiesService.UpdateObject(${safeStringify({id, data})})`);
      const db = await this.GetObject(id);
      const obj = await this.dbService.refCompetentie.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id, db, data, obj, actorId);
      const result = obj;
      this.logger.verbose(`CompetentiesService.UpdateObject() => ${safeStringify(result)}`);
      return result;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`CompetentiesService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.refCompetentie.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name,  id, db, actorId);
   }

   // maak de dataset voor de GetObjects response, inclusief de relaties met andere tabellen
   private async MaakGetObjectsResponseDataset(objs: CompetentieMetRelaties[]): Promise<GetObjectsRefCompetentiesResponse[]>
   {
      this.logger.verbose(`CompetentiesService.MaakGetObjectsResponseDataset(${safeStringify({objs})})`);
      const result = objs.map((obj) => {
         const {LeerfaseType: leerfaseType, ...competentie} = obj;

         return {
            ...competentie,
            LEERFASE: leerfaseType?.OMSCHRIJVING ?? null
         } as GetObjectsRefCompetentiesResponse
      });
      this.logger.verbose(`CompetentiesService.MaakGetObjectsResponseDataset() => ${safeStringify(result)}`);
      return result;
   }
}
