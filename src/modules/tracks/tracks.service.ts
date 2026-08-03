import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperTrack} from "@prisma/client";
import {GetObjectsOperTracksRequest} from "./GetObjectsOperTracksRequest";
import {GetObjectsOperTracksResponse} from "./GetObjectsOperTracksResponse";
import {CreateOperTrackDto} from "../../generated/nestjs-dto/create-operTrack.dto";
import {UpdateOperTrackDto} from "../../generated/nestjs-dto/update-operTrack.dto";
import {safeStringify} from "../../core/helpers/LogHelper";

// track record inclusief de relaties die de PHP tracks_view samenvoegt
type TrackMetRelaties = Prisma.OperTrackGetPayload<{
   include: {
      Lid: true,
      Instructeur: true,
   }
}>;

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
      // relatie wordt meegenomen voor consistentie met andere services, maar wordt niet gebruikt.
      // Net als in de PHP implementatie wordt hier de ruwe tabel gebruikt, niet de tracks_view.
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
                  // tracks_view/verwijderd_tracks_view filteren in de PHP implementatie altijd op l.VERWIJDERD = 0,
                  // ook bij het opvragen van verwijderde tracks. Zie CreateViews() in class.Tracks.inc.php
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

      const response = objs.map((obj: TrackMetRelaties) =>
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

   async AddObject(data: CreateOperTrackDto): Promise<OperTrack>
   {
      this.logger.verbose(`TracksService.AddObject(${safeStringify({data})})`);
      const {LID_ID, INSTRUCTEUR_ID, START_ID, ...rest} = data;
      const connect = (id?: number) => id !== undefined ? {connect: {ID: id}} : undefined;
      const insertData: Prisma.OperTrackCreateInput = {
         ...rest,
         Lid: {connect: {ID: LID_ID}},
         Instructeur: connect(INSTRUCTEUR_ID),
         Startlijst: connect(START_ID),
      };

      const obj = await this.dbService.operTrack.create({
         data: insertData
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, insertData, obj);
      const result = obj;
      this.logger.verbose(`TracksService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   /**
    * Een track wordt bij een update NOOIT in-place aangepast: het bestaande record wordt gemarkeerd als
    * verwijderd, en er wordt een NIEUW record aangemaakt met LINK_ID naar het oorspronkelijke record. Zo blijft
    * de volledige historie van aanpassingen bewaard (audit trail), zie UpdateObject() in class.Tracks.inc.php.
    * De oorspronkelijke INGEVOERD datum blijft behouden op het nieuwe record.
    */
   async UpdateObject(id: number, data: UpdateOperTrackDto): Promise<OperTrack>
   {
      this.logger.verbose(`TracksService.UpdateObject(${safeStringify({id, data})})`);
      const oud = await this.GetObject(id);

      const lidId = data.LID_ID ?? oud.LID_ID;
      const instructeurId = data.INSTRUCTEUR_ID !== undefined ? data.INSTRUCTEUR_ID : oud.INSTRUCTEUR_ID;
      const tekst = data.TEKST !== undefined ? data.TEKST : oud.TEKST;
      const startId = data.START_ID !== undefined ? data.START_ID : oud.START_ID;

      const connectIfSet = (relId?: number) => relId != null ? {connect: {ID: relId}} : undefined;
      const nieuw = await this.dbService.$transaction(async (tx) =>
      {
         await tx.operTrack.update({where: {ID: id}, data: {VERWIJDERD: true}});

         return tx.operTrack.create({
            data: {
               Lid: {connect: {ID: lidId}},
               Instructeur: connectIfSet(instructeurId),
               TEKST: tekst,
               Startlijst: connectIfSet(startId),
               INGEVOERD: oud.INGEVOERD,
               Track: {connect: {ID: id}},
            }
         });
      });

      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id, oud, data, nieuw);
      const result = nieuw;
      this.logger.verbose(`TracksService.UpdateObject() => ${safeStringify(result)}`);
      return result;
   }

   // eenvoudige VERWIJDERD toggle, gebruikt door DeleteObject/RestoreObject. Dit is BEWUST geen UpdateObject()
   // aanroep: die zou een overbodige gekoppelde audit trail record aanmaken voor een simpele soft-delete/restore.
   async SetVerwijderd(id: number, verwijderd: boolean): Promise<OperTrack>
   {
      this.logger.verbose(`TracksService.SetVerwijderd(${safeStringify({id, verwijderd})})`);
      const db = await this.GetObject(id);
      const obj = await this.dbService.operTrack.update({
         where: {
            ID: id
         },
         data: {
            VERWIJDERD: verwijderd
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id, db, {VERWIJDERD: verwijderd}, obj);
      const result = obj;
      this.logger.verbose(`TracksService.SetVerwijderd() => ${safeStringify(result)}`);
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