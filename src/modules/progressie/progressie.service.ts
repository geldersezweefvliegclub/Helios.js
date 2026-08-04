import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperProgressie} from "@prisma/client";
import {GetObjectsOperProgressieRequest} from "./GetObjectsOperProgressieRequest";
import {GetObjectsOperProgressieResponse} from "./GetObjectsOperProgressieResponse";
import {safeStringify} from "../../core/helpers/LogHelper";
import {parseDateOnly, toDateOnly} from "../../core/helpers/DateOnly";

// progressie record inclusief de relaties die de PHP progressie_view samenvoegt
type ProgressieMetRelaties = Prisma.OperProgressieGetPayload<{
   include: {
      RefCompetentie: {include: {LeerfaseType: true}},
      RefLid: true,
      Instructeur: true,
   }
}>;

export interface UpdateProgressieData {
   LID_ID?: number;
   COMPETENTIE_ID?: number;
   INSTRUCTEUR_ID?: number;
   OPMERKINGEN?: string | null;
   SCORE?: number | null;
   GELDIG_TOT?: Date | null;
}

@Injectable()
export class ProgressieService extends IHeliosService
{
   private readonly logger = new Logger(ProgressieService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number, relation: string = undefined): Promise<OperProgressie>
   {
      this.logger.verbose(`ProgressieService.GetObject(${safeStringify({id, relation})})`);
      // relatie wordt meegenomen voor consistentie met andere services, maar wordt niet gebruikt.
      // Net als in de PHP implementatie wordt hier de ruwe tabel gebruikt, niet de progressie_view.
      const db = await this.dbService.operProgressie.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`Progressie record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      const result = db;
      this.logger.verbose(`ProgressieService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsOperProgressieRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperProgressieResponse>>
   {
      this.logger.verbose(`ProgressieService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
      {
         params = new GetObjectsOperProgressieRequest();
         params.VERWIJDERD = false;
      }
      const where: Prisma.OperProgressieWhereInput =
         {
            AND:
               [
                  { ID: params.ID},
                  { VERWIJDERD: params.VERWIJDERD ?? false},
                  { ID: { in: params.IDs }},
                  { LID_ID: params.LID_ID },
                  { INSTRUCTEUR_ID: params.INSTRUCTEUR_ID },
                  { COMPETENTIE_ID: { in: params.IN }},
               ]
         }
      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.operProgressie.count({where: where});
      }
      const objs = await this.dbService.operProgressie.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperProgressieOrderByWithRelationInput>(params.SORT ?? "LID_ID, LAATSTE_AANPASSING DESC"),
         take: params.MAX,
         skip: params.START,
         include: {
            RefCompetentie: {include: {LeerfaseType: true}},
            RefLid: true,
            Instructeur: true,
         }
      });

      const response = objs.map((obj: ProgressieMetRelaties) =>
      {
         const {RefCompetentie: competentie, RefLid: lid, Instructeur: instructeur, ...progressie} = obj;
         return {
            ...progressie,
            GELDIG_TOT: toDateOnly(progressie.GELDIG_TOT) as unknown as Date,
            LEERFASE_ID: competentie.LEERFASE_ID,
            LEERFASE: competentie.LeerfaseType?.OMSCHRIJVING ?? null,
            COMPETENTIE: competentie.OMSCHRIJVING,
            LID_NAAM: lid.NAAM,
            INSTRUCTEUR_NAAM: instructeur.NAAM,
         } as GetObjectsOperProgressieResponse;
      });

      const result = this.buildGetObjectsResponse(response, count, params.HASH);
      this.logger.verbose(`ProgressieService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.OperProgressieUncheckedCreateInput): Promise<OperProgressie>
   {
      this.logger.verbose(`ProgressieService.AddObject(${safeStringify({data})})`);
      data.GELDIG_TOT = parseDateOnly(data.GELDIG_TOT as Date | string | null);
      const obj = await this.dbService.operProgressie.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj);
      const result = {...obj, GELDIG_TOT: toDateOnly(obj.GELDIG_TOT) as unknown as Date};
      this.logger.verbose(`ProgressieService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   /**
    * Een progressie wordt bij een update NOOIT in-place aangepast: het bestaande record wordt gemarkeerd als
    * verwijderd, en er wordt een NIEUW record aangemaakt met LINK_ID naar het oorspronkelijke record. Zo blijft
    * de volledige historie van afgetekende competenties bewaard (audit trail), zie UpdateObject() in
    * class.Progressie.inc.php. De oorspronkelijke INGEVOERD datum blijft behouden op het nieuwe record.
    */
   async UpdateObject(id: number, data: UpdateProgressieData): Promise<OperProgressie>
   {
      this.logger.verbose(`ProgressieService.UpdateObject(${safeStringify({id, data})})`);
      const oud = await this.GetObject(id);

      const lidId = data.LID_ID ?? oud.LID_ID;
      const competentieId = data.COMPETENTIE_ID ?? oud.COMPETENTIE_ID;
      const instructeurId = data.INSTRUCTEUR_ID ?? oud.INSTRUCTEUR_ID;
      const opmerkingen = data.OPMERKINGEN !== undefined ? data.OPMERKINGEN : oud.OPMERKINGEN;
      const score = data.SCORE !== undefined ? data.SCORE : oud.SCORE;
      const geldigTot = data.GELDIG_TOT !== undefined ? parseDateOnly(data.GELDIG_TOT as Date | string | null) : oud.GELDIG_TOT;

      const nieuw = await this.dbService.$transaction(async (tx) =>
      {
         await tx.operProgressie.update({where: {ID: id}, data: {VERWIJDERD: true}});

         return tx.operProgressie.create({
            data: {
               RefLid: {connect: {ID: lidId}},
               RefCompetentie: {connect: {ID: competentieId}},
               Instructeur: {connect: {ID: instructeurId}},
               OPMERKINGEN: opmerkingen,
               SCORE: score,
               GELDIG_TOT: geldigTot,
               INGEVOERD: oud.INGEVOERD,
               ParentProgressie: {connect: {ID: id}},
            }
         });
      });

      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id, oud, data, nieuw);
      const result = {...nieuw, GELDIG_TOT: toDateOnly(nieuw.GELDIG_TOT) as unknown as Date};
      this.logger.verbose(`ProgressieService.UpdateObject() => ${safeStringify(result)}`);
      return result;
   }

   // eenvoudige VERWIJDERD toggle, gebruikt door DeleteObject/RestoreObject. Dit is BEWUST geen UpdateObject()
   // aanroep: die zou een overbodige gekoppelde audit trail record aanmaken voor een simpele soft-delete/restore.
   async SetVerwijderd(id: number, verwijderd: boolean): Promise<OperProgressie>
   {
      this.logger.verbose(`ProgressieService.SetVerwijderd(${safeStringify({id, verwijderd})})`);
      const db = await this.GetObject(id);
      const obj = await this.dbService.operProgressie.update({
         where: {
            ID: id
         },
         data: {
            VERWIJDERD: verwijderd
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id, db, {VERWIJDERD: verwijderd}, obj);
      const result = obj;
      this.logger.verbose(`ProgressieService.SetVerwijderd() => ${safeStringify(result)}`);
      return result;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`ProgressieService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.operProgressie.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db, actorId);
   }
}