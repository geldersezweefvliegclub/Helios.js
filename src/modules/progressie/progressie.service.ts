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
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";
import {toDateOnly} from "../../core/helpers/TimeDate";

// progressie record inclusief de relaties die de PHP progressie_view samenvoegt
type ProgressieMetRelaties = Prisma.OperProgressieGetPayload<{
   include: {
      RefCompetentie: {include: {LeerfaseType: true}},
      RefLid: true,
      Instructeur: true,
   }
}>;

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
   async GetObject(id: number): Promise<OperProgressie>
   {
      this.logger.verbose(`ProgressieService.GetObject(${safeStringify({id})})`);
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
         params = MaakGetObjectsRequest(GetObjectsOperProgressieRequest, {VERWIJDERD: false});
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

      const dataset = await this.MaakGetObjectsResponseDataset(objs);
      const result = this.buildGetObjectsResponse(dataset, count, params.HASH);
      this.logger.verbose(`ProgressieService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.OperProgressieUncheckedCreateInput, actorId: number): Promise<OperProgressie>
   {
      this.logger.verbose(`ProgressieService.AddObject(${safeStringify({data})})`);
      await this.uniekeProgressie(data.LID_ID as number, data.COMPETENTIE_ID as number);

      const obj = await this.dbService.operProgressie.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj, actorId);
      this.logger.verbose(`ProgressieService.AddObject() => ${safeStringify(obj)}`);
      return obj;
   }


   async UpdateObject(id: number, data: Prisma.OperProgressieUncheckedUpdateInput, actorId: number): Promise<OperProgressie>
   {
      this.logger.verbose(`ProgressieService.UpdateObject(${safeStringify({id, data})})`);
      const db = await this.GetObject(id);

      const nieuweLidId = data.LID_ID !== undefined ? data.LID_ID as number : db.LID_ID;
      const nieuweCompetentieId = data.COMPETENTIE_ID !== undefined ? data.COMPETENTIE_ID as number : db.COMPETENTIE_ID;
      await this.uniekeProgressie(nieuweLidId, nieuweCompetentieId, id);

      const obj = await this.dbService.operProgressie.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id, db, data, obj, actorId);
      this.logger.verbose(`ProgressieService.UpdateObject() => ${safeStringify(obj)}`);
      return obj;
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

   // bepaalt voor een lijst van lid IDs welke daarvan een (niet-verwijderd) progressie record hebben voor
   // de opgegeven competentie - bijv. gebruikt door LedenService om PAX bevoegdheid te tonen zonder dat de
   // Leden module rechtstreeks de progressie tabel hoeft te bevragen. Geen LID_ID meegegeven controleert alle leden
   async HeeftCompetentie(competentieId: number, lidIds?: number[]): Promise<number[]>
   {
      this.logger.verbose(`ProgressieService.HeeftCompetentie(${safeStringify({competentieId, lidIds})})`);
      const progressies = await this.dbService.operProgressie.findMany({
         where: {
            COMPETENTIE_ID: competentieId,
            LID_ID: lidIds ? {in: lidIds} : undefined,
            VERWIJDERD: false
         },
         select: {LID_ID: true}
      });

      const result = [...new Set(progressies.map((progressie) => progressie.LID_ID))];
      this.logger.verbose(`ProgressieService.HeeftCompetentie() => ${safeStringify(result)}`);
      return result;
   }

   // een lid mag maar 1 actief (niet-verwijderd) progressie record hebben per competentie
   private async uniekeProgressie(lidId: number, competentieId: number, uitgezonderdId?: number): Promise<void>
   {
      const bestaand = await this.dbService.operProgressie.findFirst({
         where: {
            LID_ID: lidId,
            COMPETENTIE_ID: competentieId,
            VERWIJDERD: false,
            ID: uitgezonderdId ? { not: uitgezonderdId } : undefined
         }
      });

      if (bestaand) {
         throw new HttpException(`Lid ${lidId} heeft al een progressie record voor competentie ${competentieId}`, HttpStatus.CONFLICT);
      }
   }

   // maak de dataset voor de GetObjects response, inclusief de relaties met andere tabellen
   private async MaakGetObjectsResponseDataset(objs: ProgressieMetRelaties[]): Promise<GetObjectsOperProgressieResponse[]>
   {
      this.logger.verbose(`ProgressieService.MaakGetObjectsResponseDataset(${safeStringify({objs})})`);
      const result = objs.map((obj) =>
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
      this.logger.verbose(`ProgressieService.MaakGetObjectsResponseDataset() => ${safeStringify(result)}`);
      return result;
   }
}