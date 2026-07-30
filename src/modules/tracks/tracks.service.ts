import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperTrack} from "@prisma/client";
import {GetObjectsOperTracksRequest} from "./GetObjectsOperTracksRequest";
import {GetObjectsOperTracksResponse} from "./GetObjectsOperTracksResponse";

// track record inclusief de relaties die de PHP tracks_view samenvoegt
type TrackMetRelaties = Prisma.OperTrackGetPayload<{
   include: {
      Lid: true,
      Instructeur: true,
   }
}>;

export interface UpdateTrackData {
   LID_ID?: number;
   INSTRUCTEUR_ID?: number | null;
   TEKST?: string | null;
   START_ID?: number | null;
}

@Injectable()
export class TracksService extends IHeliosService
{
   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // retrieve a single object from the database based on the id
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   async GetObject(id: number, relation: string = undefined): Promise<OperTrack>
   {
      // relation is included for consistency with other services, but not used.
      // Net als in de PHP implementatie wordt hier de ruwe tabel gebruikt, niet de tracks_view.
      const db = await this.dbService.operTrack.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`Track record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      return db;
   }

   // retrieve objects from the database based on the query parameters
   async GetObjects(params?: GetObjectsOperTracksRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperTracksResponse>>
   {
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

      return this.buildGetObjectsResponse(response, count, params.HASH);
   }

   async AddObject(data: Prisma.OperTrackCreateInput): Promise<OperTrack>
   {
      // TEKST is niet verplicht op DB niveau, maar wel verplicht volgens de business regel uit class.Tracks.inc.php AddObject()
      if (!data.TEKST)
         throw new HttpException("TEKST is verplicht", HttpStatus.BAD_REQUEST);

      const obj = await this.dbService.operTrack.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      return obj;
   }

   /**
    * Een track wordt bij een update NOOIT in-place aangepast: het bestaande record wordt gemarkeerd als
    * verwijderd, en er wordt een NIEUW record aangemaakt met LINK_ID naar het oorspronkelijke record. Zo blijft
    * de volledige historie van aanpassingen bewaard (audit trail), zie UpdateObject() in class.Tracks.inc.php.
    * De oorspronkelijke INGEVOERD datum blijft behouden op het nieuwe record.
    */
   async UpdateObject(id: number, data: UpdateTrackData): Promise<OperTrack>
   {
      const oud = await this.GetObject(id);

      const lidId = data.LID_ID ?? oud.LID_ID;
      const instructeurId = data.INSTRUCTEUR_ID !== undefined ? data.INSTRUCTEUR_ID : oud.INSTRUCTEUR_ID;
      const tekst = data.TEKST !== undefined ? data.TEKST : oud.TEKST;
      const startId = data.START_ID !== undefined ? data.START_ID : oud.START_ID;

      const nieuw = await this.dbService.$transaction(async (tx) =>
      {
         await tx.operTrack.update({where: {ID: id}, data: {VERWIJDERD: true}});

         return tx.operTrack.create({
            data: {
               Lid: {connect: {ID: lidId}},
               Instructeur: instructeurId != null ? {connect: {ID: instructeurId}} : undefined,
               TEKST: tekst,
               Startlijst: startId != null ? {connect: {ID: startId}} : undefined,
               INGEVOERD: oud.INGEVOERD,
               Track: {connect: {ID: id}},
            }
         });
      });

      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id, oud, data, nieuw);
      return nieuw;
   }

   // eenvoudige VERWIJDERD toggle, gebruikt door DeleteObject/RestoreObject. Dit is BEWUST geen UpdateObject()
   // aanroep: die zou een overbodige gekoppelde audit trail record aanmaken voor een simpele soft-delete/restore.
   async SetVerwijderd(id: number, verwijderd: boolean): Promise<OperTrack>
   {
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
      return obj;
   }

   async RemoveObject(id: number): Promise<void>
   {
      const db = await this.GetObject(id);
      await this.dbService.operTrack.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db);
   }
}