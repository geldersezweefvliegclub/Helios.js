import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperTrack} from "@prisma/client";
import {GetObjectsOperTracksRequest} from "./GetObjectsOperTracksRequest";
import {GetObjectsOperTracksResponse} from "./GetObjectsOperTracksResponse";
import {safeStringify} from "../../core/helpers/LogHelper";

@Injectable()
export class TracksService extends IHeliosService
{
   private readonly logger = new Logger(TracksService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number, relation: string = undefined): Promise<OperTrack>
   {
      this.logger.verbose(`TracksService.GetObject(${safeStringify({id, relation})})`);
      const db = await this.dbService.operTrack.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`Track record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);

      const result = db;
      this.logger.verbose(`TracksService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsOperTracksRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperTracksResponse>>
   {
      this.logger.verbose(`TracksService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
      {
         params = new GetObjectsOperTracksRequest();
         params.VERWIJDERD = false;
      }
      const where: Prisma.OperTrackWhereInput =
         {
            AND:
               [
                  { ID: params.ID},
                  { VERWIJDERD: params.VERWIJDERD ?? false},
                  { ID: { in: params.IDs }},
                  { LID_ID: params.LID_ID },
                  { INSTRUCTEUR_ID: params.INSTRUCTEUR_ID },
                  { Lid: { VERWIJDERD: false } },
               ]
         }
      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.operTrack.count({where: where});
      }
      const objs = await this.dbService.operTrack.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperTrackOrderByWithRelationInput>(params.SORT ?? "LAATSTE_AANPASSING DESC"),
         take: params.MAX,
         skip: params.START,
         include: {
            Lid: true,
            Instructeur: true,
         }
      });

      const response = objs.map((obj) =>
      {
         const {Lid: lid, Instructeur: instructeur, ...track} = obj;
         return {
            ...track,
            LID_NAAM: lid.NAAM,
            INSTRUCTEUR_NAAM: instructeur?.NAAM ?? null,
         } as GetObjectsOperTracksResponse;
      });

      const result = this.buildGetObjectsResponse(response, count, params.HASH);
      this.logger.verbose(`TracksService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.OperTrackUncheckedCreateInput, actorId: number): Promise<OperTrack>
   {
      this.logger.verbose(`TracksService.AddObject(${safeStringify({data})})`);
      const obj = await this.dbService.operTrack.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj, actorId);
      const result = obj;
      this.logger.verbose(`TracksService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   async UpdateObject(id: number, data: Prisma.OperTrackUncheckedUpdateInput, actorId: number): Promise<OperTrack>
   {
      this.logger.verbose(`TracksService.UpdateObject(${safeStringify({id, data})})`);
      const db = await this.GetObject(id);
      const obj = await this.dbService.operTrack.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id, db, data, obj, actorId);
      const result = obj;
      this.logger.verbose(`TracksService.UpdateObject() => ${safeStringify(result)}`);
      return result;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`TracksService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.operTrack.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db, actorId);
   }
}