import {forwardRef, HttpException, HttpStatus, Inject, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperAanwezigVliegtuig} from "@prisma/client";
import {GetObjectsOperAanwezigVliegtuigenRequest} from "./GetObjectsOperAanwezigVliegtuigenRequest";
import {GetObjectsOperAanwezigVliegtuigenResponse} from "./GetObjectsOperAanwezigVliegtuigenResponse";
import {safeStringify} from "../../core/helpers/LogHelper";
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";
import {DatumZonderTijd, parseDateOnly, toDateOnly, toTimeOnly} from "../../core/helpers/TimeDate";
import {RegCall} from "../../core/helpers/RegCall";
import {StartlijstService} from "../startlijst/startlijst.service";
import {AanmeldenVliegtuigRequest} from "./AanmeldenVliegtuigRequest";
import {AfmeldenVliegtuigRequest} from "./AfmeldenVliegtuigRequest";

// aanwezig vliegtuig record inclusief de relaties die de PHP aanwezig_vliegtuigen_view samenvoegt
type AanwezigVliegtuigMetRelaties = Prisma.OperAanwezigVliegtuigGetPayload<{
   include: {
      Vliegtuig: { include: { VliegtuigType: true } },
      Veld: true,
   }
}>;

@Injectable()
export class AanwezigVliegtuigenService extends IHeliosService
{
   private readonly logger = new Logger(AanwezigVliegtuigenService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2,
               @Inject(forwardRef(() => StartlijstService)) private readonly startlijstService: StartlijstService)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number): Promise<OperAanwezigVliegtuig>
   {
      this.logger.verbose(`AanwezigVliegtuigenService.GetObject(${safeStringify({id})})`);
      const db = await this.dbService.operAanwezigVliegtuig.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`AanwezigVliegtuig record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      const result = db;
      this.logger.verbose(`AanwezigVliegtuigenService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsOperAanwezigVliegtuigenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperAanwezigVliegtuigenResponse>>
   {
      this.logger.verbose(`AanwezigVliegtuigenService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
         params = MaakGetObjectsRequest(GetObjectsOperAanwezigVliegtuigenRequest, {VERWIJDERD: false});
      const where: Prisma.OperAanwezigVliegtuigWhereInput =
         {
            AND:
               [
                  { ID: params.ID},
                  { VERWIJDERD: params.VERWIJDERD ?? false},
                  { ID: { in: params.IDs }},
                  params.NIET_VERTROKKEN ? { VERTREK: null } : {},
               ]
         }
      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.operAanwezigVliegtuig.count({where: where});
      }
      const objs = await this.dbService.operAanwezigVliegtuig.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperAanwezigVliegtuigOrderByWithRelationInput>(params.SORT ?? "DATUM"),
         take: params.MAX,
         skip: params.START,
         include: {
            Vliegtuig: {
               include: {
                  VliegtuigType: true,
               }
            },
            Veld: true,
         }
      });

      const dataset = await this.MaakGetObjectsResponseDataset(objs);
      const result = this.buildGetObjectsResponse(dataset, count, params.HASH);
      this.logger.verbose(`AanwezigVliegtuigenService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.OperAanwezigVliegtuigUncheckedCreateInput, actorId: number): Promise<OperAanwezigVliegtuig>
   {
      this.logger.verbose(`AanwezigVliegtuigenService.AddObject(${safeStringify({data})})`);
      const obj = await this.dbService.operAanwezigVliegtuig.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj, actorId);
      this.logger.verbose(`AanwezigVliegtuigenService.AddObject() => ${safeStringify(obj)}`);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.OperAanwezigVliegtuigUncheckedUpdateInput, actorId: number): Promise<OperAanwezigVliegtuig>
   {
      this.logger.verbose(`AanwezigVliegtuigenService.UpdateObject(${safeStringify({id, data})})`);
      const db = await this.GetObject(id);
      const obj = await this.dbService.operAanwezigVliegtuig.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, data, obj, actorId);
      this.logger.verbose(`AanwezigVliegtuigenService.UpdateObject() => ${safeStringify(obj)}`);
      return obj;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`AanwezigVliegtuigenService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.operAanwezigVliegtuig.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db, actorId);
   }

   // Aanmelden van een vliegtuig als aanwezig. Maakt een nieuw record aan, of past de bestaande aanmelding
   // van dat vliegtuig op die dag aan, zie AanwezigVliegtuigen.Aanmelden() in de PHP implementatie.
   async Aanmelden(data: AanmeldenVliegtuigRequest, actorId: number): Promise<OperAanwezigVliegtuig>
   {
      this.logger.verbose(`AanwezigVliegtuigenService.Aanmelden(${safeStringify({data})})`);
      if (data.VLIEGTUIG_ID === undefined || data.VLIEGTUIG_ID === null)
         throw new HttpException("VLIEGTUIG_ID moet ingevuld zijn", HttpStatus.NOT_ACCEPTABLE);

      const tijdstip = new Date();
      const datum = data.DATUM ? parseDateOnly(data.DATUM) as Date : DatumZonderTijd(tijdstip);

      const bestaand = await this.BestaandeAanmelding(data.VLIEGTUIG_ID, datum);

      if (bestaand)
      {
         const update: Prisma.OperAanwezigVliegtuigUpdateInput = {};
         let aanpassen = false;

         if (bestaand.AANKOMST === null)
         {
            update.AANKOMST = tijdstip;
            aanpassen = true;
         }

         if (bestaand.VERTREK !== null)
         {
            update.VERTREK = null;
            aanpassen = true;
         }

         const overigeVelden = ["LATITUDE", "LONGITUDE", "HOOGTE", "SNELHEID", "VELD_ID"] as const;
         for (const veld of overigeVelden)
         {
            if (data[veld] !== undefined && data[veld] !== bestaand[veld])
            {
               (update as Record<string, unknown>)[veld] = data[veld];
               aanpassen = true;
            }
         }

         if (!aanpassen)
         {
            this.logger.verbose(`AanwezigVliegtuigenService.Aanmelden: niet aangepast, id=${bestaand.ID}`);
            return bestaand;
         }

         await this.UpdateObject(bestaand.ID, update, actorId);
         const result = await this.GetObject(bestaand.ID);
         this.logger.verbose(`AanwezigVliegtuigenService.Aanmelden() => ${safeStringify(result)}`);
         return result;
      }

      const insertData: Prisma.OperAanwezigVliegtuigUncheckedCreateInput = {
         DATUM: datum,
         VLIEGTUIG_ID: data.VLIEGTUIG_ID,
         AANKOMST: data.AANKOMST as Date ?? tijdstip,
         VERTREK: null, // zeker weten dat vertrek niet gezet wordt bij een nieuwe aanmelding
         LATITUDE: data.LATITUDE,
         LONGITUDE: data.LONGITUDE,
         HOOGTE: data.HOOGTE,
         SNELHEID: data.SNELHEID,
         VELD_ID: data.VELD_ID,
      };

      const aangemeld = await this.AddObject(insertData, actorId);
      const result = await this.GetObject(aangemeld.ID);
      this.logger.verbose(`AanwezigVliegtuigenService.Aanmelden() => ${safeStringify(result)}`);
      return result;
   }

   // Afmelden van een aangemeld vliegtuig, zie AanwezigVliegtuigen.Afmelden() in de PHP implementatie.
   async Afmelden(data: AfmeldenVliegtuigRequest, actorId: number): Promise<OperAanwezigVliegtuig>
   {
      this.logger.verbose(`AanwezigVliegtuigenService.Afmelden(${safeStringify({data})})`);
      if (data.VLIEGTUIG_ID === undefined || data.VLIEGTUIG_ID === null)
         throw new HttpException("VLIEGTUIG_ID moet ingevuld zijn", HttpStatus.NOT_ACCEPTABLE);

      const nu = new Date();

      const bestaand = (data.ID !== undefined && data.ID !== null)
         ? await this.GetObject(data.ID).catch(() => null)
         : await this.BestaandeAanmelding(data.VLIEGTUIG_ID, DatumZonderTijd(nu));

      if (!bestaand)
         throw new HttpException("Kan een vliegtuig alleen afmelden als het eerst aangemeld is", HttpStatus.CONFLICT);

      const update: Prisma.OperAanwezigVliegtuigUpdateInput = {
         VERTREK: data.VERTREK !== undefined ? data.VERTREK as Date : nu,
      };

      await this.UpdateObject(bestaand.ID, update, actorId);
      const result = await this.GetObject(bestaand.ID);
      this.logger.verbose(`AanwezigVliegtuigenService.Afmelden() => ${safeStringify(result)}`);
      return result;
   }

   // maak de dataset voor de GetObjects response, inclusief de relaties met andere tabellen: vliegtuig- en type-gegevens via joins,
   // en of het vliegtuig momenteel aan het vliegen is via StartlijstService.VliegtuigVliegt()
   private async MaakGetObjectsResponseDataset(objs: AanwezigVliegtuigMetRelaties[]): Promise<GetObjectsOperAanwezigVliegtuigenResponse[]>
   {
      this.logger.verbose(`AanwezigVliegtuigenService.MaakGetObjectsResponseDataset(${safeStringify({objs})})`);
      if (objs.length === 0)
      {
         const result = [];
         this.logger.verbose(`AanwezigVliegtuigenService.MaakGetObjectsResponseDataset() => ${safeStringify(result)}`);
         return result;
      }

      const result = await Promise.all(objs.map(async obj =>
      {
         const {Vliegtuig: vliegtuig, Veld: veld, ...aanwezigVliegtuig} = obj;

         const vliegtNu = await this.startlijstService.VliegtuigVliegt(obj.VLIEGTUIG_ID, obj.DATUM);

         return {
            ...aanwezigVliegtuig,
            DATUM: toDateOnly(aanwezigVliegtuig.DATUM) as unknown as Date,
            AANKOMST: toTimeOnly(aanwezigVliegtuig.AANKOMST) as unknown as Date,
            VERTREK: toTimeOnly(aanwezigVliegtuig.VERTREK) as unknown as Date,
            REGISTRATIE: vliegtuig.REGISTRATIE,
            CALLSIGN: vliegtuig.CALLSIGN,
            REG_CALL: RegCall(vliegtuig.REGISTRATIE, vliegtuig.CALLSIGN),
            ZITPLAATSEN: vliegtuig.ZITPLAATSEN,
            CLUBKIST: vliegtuig.CLUBKIST,
            FLARMCODE: vliegtuig.FLARMCODE,
            TYPE_ID: vliegtuig.TYPE_ID,
            VLIEGTUIGTYPE_OMS: vliegtuig.VliegtuigType?.OMSCHRIJVING ?? null,
            TMG: vliegtuig.TMG,
            ZELFSTART: vliegtuig.ZELFSTART,
            SLEEPKIST: vliegtuig.SLEEPKIST,
            VOLGORDE: vliegtuig.VOLGORDE,
            INZETBAAR: vliegtuig.INZETBAAR,
            TRAINER: vliegtuig.TRAINER,
            OPMERKINGEN: vliegtuig.OPMERKINGEN,
            VELD: veld?.OMSCHRIJVING ?? null,
            VLIEGT: vliegtNu ? 1 : 0,
         } as GetObjectsOperAanwezigVliegtuigenResponse;
      }));
      this.logger.verbose(`AanwezigVliegtuigenService.MaakGetObjectsResponseDataset() => ${safeStringify(result)}`);
      return result;
   }

   // zoekt de actieve aanmelding van dit vliegtuig op deze datum, of null
   private async BestaandeAanmelding(vliegtuigId: number, datum: Date): Promise<OperAanwezigVliegtuig | null>
   {
      this.logger.verbose(`AanwezigVliegtuigenService.BestaandeAanmelding(${safeStringify({vliegtuigId, datum})})`);
      const result = await this.dbService.operAanwezigVliegtuig.findFirst({
         where: {VLIEGTUIG_ID: vliegtuigId, DATUM: datum, VERWIJDERD: false}
      });
      this.logger.verbose(`AanwezigVliegtuigenService.BestaandeAanmelding() => ${safeStringify(result)}`);
      return result;
   }
}
