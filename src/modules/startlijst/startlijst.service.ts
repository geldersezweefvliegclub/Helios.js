import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperStartlijst} from "@prisma/client";
import {GetObjectsOperStartlijstRequest} from "./GetObjectsOperStartlijstRequest";
import {GetObjectsOperStartlijstResponse} from "./GetObjectsOperStartlijstResponse";
import {safeStringify} from "../../core/helpers/LogHelper";
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";
import {DatumZonderTijd, MinutenNaarTijd, toDateOnly, toTimeOnly} from "../../core/helpers/TimeDate";
import {RegCall} from "../../core/helpers/RegCall";
import {getSunset} from "sunrise-sunset-js";
import {StartMethode} from "../../core/enums/StartMethode";
import {RecencyResponse} from "./RecencyResponse";
import {GetLogboekRequest} from "./GetLogboekRequest";
import {GetLogboekResponse} from "./GetLogboekResponse";
import {GetVliegtuigLogboekRequest} from "./GetVliegtuigLogboekRequest";
import {GetVliegtuigLogboekResponse} from "./GetVliegtuigLogboekResponse";
import {GetVliegtuigLogboekTotalenRequest} from "./GetVliegtuigLogboekTotalenRequest";
import {
   GetVliegtuigLogboekTotalenJaarResponse,
   GetVliegtuigLogboekTotalenMaandResponse,
   GetVliegtuigLogboekTotalenResponse
} from "./GetVliegtuigLogboekTotalenResponse";

// coördinaten van Vliegveld Terlet (Vliegveld.Terlet, zie enums/Vliegveld.ts) - zelfde waarden als de
// "airport"-configuratie in Pegasus (pegasus.config.json), voor consistente zonsondergangberekeningen
const TERLET_LATITUDE = 52.0507;
const TERLET_LONGITUDE = 5.9292;

// startlijst record inclusief de relaties die de PHP startlijst_view samenvoegt
type StartlijstMetRelaties = Prisma.OperStartlijstGetPayload<{
   include: {
      Vliegtuig: {include: {VliegtuigType: true}},
      Sleepkist: true,
      Vlieger: true,
      Inzittende: true,
      Startmethode: true,
      Veld: true,
      Baan: true,
   }
}>;

@Injectable()
export class StartlijstService extends IHeliosService
{
   private readonly logger = new Logger(StartlijstService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number): Promise<OperStartlijst>
   {
      this.logger.verbose(`StartlijstService.GetObject(${safeStringify({id})})`);
      // Net als in de PHP implementatie wordt hier de ruwe tabel gebruikt, niet de startlijst_view.
      const db = await this.dbService.operStartlijst.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`Startlijst record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      const result = db;
      this.logger.verbose(`StartlijstService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsOperStartlijstRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperStartlijstResponse>>
   {
      this.logger.verbose(`StartlijstService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
         params = MaakGetObjectsRequest(GetObjectsOperStartlijstRequest, {VERWIJDERD: false});
      const dtSpanne = params.VanTot(params.DATUM, params.BEGIN_DATUM, params.EIND_DATUM);

      // DDWV is geen kolom op oper_startlijst maar afgeleid van oper_daginfo/oper_rooster op DATUM, zie startlijst_view
      let ddwvDatums: Date[] | undefined;
      if (params.DDWV)
         ddwvDatums = await this.DDWVDatums();

      const where: Prisma.OperStartlijstWhereInput =
         {
            AND:
               [
                  { ID: params.ID},
                  { VERWIJDERD: params.VERWIJDERD ?? false},
                  { ID: { in: params.IDs }},
                  { VLIEGTUIG_ID: params.VLIEGTUIG_ID },
                  { STARTMETHODE_ID: params.STARTMETHODE_ID },
                  params.LID_ID ? { OR: [{ VLIEGER_ID: params.LID_ID }, { INZITTENDE_ID: params.LID_ID }] } : {},
                  params.OPEN_STARTS ? { OR: [{ LANDINGSTIJD: null }, { VLIEGER_ID: null }] } : {},
                  params.DDWV ? { DATUM: { in: ddwvDatums } } : {},
                  params.SELECTIE ? {
                     OR: [
                        { Vlieger: { NAAM: { contains: params.SELECTIE } } },
                        { Inzittende: { NAAM: { contains: params.SELECTIE } } },
                        { VLIEGERNAAM: { contains: params.SELECTIE } },
                        { INZITTENDENAAM: { contains: params.SELECTIE } },
                        { Vliegtuig: { REGISTRATIE: { contains: params.SELECTIE } } },
                        { Vliegtuig: { CALLSIGN: { contains: params.SELECTIE } } },
                     ]
                  } : {},
                  {
                     DATUM:
                        {
                           gte: dtSpanne.start,
                           lte: dtSpanne.eind
                        }
                  }
               ]
         }
      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.operStartlijst.count({where: where});
      }
      const objs = await this.dbService.operStartlijst.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperStartlijstOrderByWithRelationInput>(params.SORT ?? "DATUM DESC, DAGNUMMER"),
         take: params.MAX,
         skip: params.START,
         include: {
            Vliegtuig: {include: {VliegtuigType: true}},
            Sleepkist: true,
            Vlieger: true,
            Inzittende: true,
            Startmethode: true,
            Veld: true,
            Baan: true,
         }
      });

      const response = await this.MaakGetObjectsResponseDataset(objs);

      const result = this.buildGetObjectsResponse(response, count, params.HASH);
      this.logger.verbose(`StartlijstService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   // logboek van een lid (of vliegtuig): alle starts van dat lid (of vliegtuig) in een bepaalde periode, inclusief de naam van de vlieger en inzittende (lid-naam of vrije-tekst naam)
   async GetLogboek(params: GetLogboekRequest, lidId: number): Promise<IHeliosGetObjectsResponse<GetLogboekResponse>>
   {
      this.logger.verbose(`StartlijstService.GetLogboek(${safeStringify({params, lidId})})`);

      // JAAR vertaalt naar BEGIN_DATUM/EIND_DATUM van dat jaar, tenzij die al expliciet zijn opgegeven
      let beginDatum = params.BEGIN_DATUM ?? (params.JAAR !== undefined ? new Date(Date.UTC(params.JAAR, 0, 1)) : undefined);
      const eindDatum = params.EIND_DATUM ?? (params.JAAR !== undefined ? new Date(Date.UTC(params.JAAR, 11, 31)) : undefined);

      // anders dan de generieke GetObjects()/VanTot(), kent GetLogboek() in PHP geen standaard tijdsvenster:
      // zonder DATUM/BEGIN_DATUM/EIND_DATUM/JAAR wordt het volledige logboek teruggegeven. VanTot() valt bij
      // afwezigheid van alle drie de datumparameters echter terug op "enkel het huidige kalenderjaar" - dat
      // wordt hier voorkomen door een ruim genoeg beginpunt te forceren.
      if (params.DATUM === undefined && beginDatum === undefined && eindDatum === undefined)
         beginDatum = new Date(Date.UTC(1900, 0, 1));

      // HASH wordt hier bewust niet doorgegeven aan de interne GetObjects() call: de hash/304-controle moet
      // plaatsvinden op de uiteindelijke logboek-projectie hieronder, niet op de ruwe Startlijst-respons
      const resultaat = await this.GetObjects(MaakGetObjectsRequest(GetObjectsOperStartlijstRequest, {
         DATUM: params.DATUM,
         BEGIN_DATUM: beginDatum,
         EIND_DATUM: eindDatum,
         LID_ID: lidId,
         VLIEGTUIG_ID: params.VLIEGTUIG_ID,
         SORT: params.SORT ?? "DATUM DESC, STARTTIJD DESC",
         MAX: params.MAX,
         START: params.START,
      }));

      const dataset = resultaat.dataset.map(vlucht => ({
         ID: vlucht.ID,
         DATUM: vlucht.DATUM,
         REG_CALL: vlucht.REG_CALL,
         VLIEGTUIG_ID: vlucht.VLIEGTUIG_ID,
         STARTTIJD: vlucht.STARTTIJD,
         LANDINGSTIJD: vlucht.LANDINGSTIJD,
         DUUR: vlucht.DUUR,
         VLIEGERNAAM: this.CombineerNaam(vlucht.VLIEGERNAAM_LID, vlucht.VLIEGERNAAM),
         INZITTENDENAAM: vlucht.PAX ? vlucht.INZITTENDENAAM : this.CombineerNaam(vlucht.INZITTENDENAAM_LID, vlucht.INZITTENDENAAM),
         VLIEGER_ID: vlucht.VLIEGER_ID,
         INZITTENDE_ID: vlucht.INZITTENDE_ID,
         STARTMETHODE: vlucht.STARTMETHODE,
         VELD: vlucht.VELD,
         PAX: vlucht.PAX,
         INSTRUCTIEVLUCHT: vlucht.INSTRUCTIEVLUCHT,
         CHECKSTART: vlucht.CHECKSTART,
         VLIEGTUIGTYPE: vlucht.VLIEGTUIGTYPE,
         OPMERKINGEN: vlucht.OPMERKINGEN,
      } as GetLogboekResponse));

      const result = this.buildGetObjectsResponse(dataset, resultaat.totaal, params.HASH);
      this.logger.verbose(`StartlijstService.GetLogboek() => ${safeStringify(result)}`);
      return result;
   }

   // combineert de lid-naam met de vrije-tekst naam (voor een vlieger/inzittende die niet als lid ingevoerd
   // staat), zie VLIEGERNAAM/INZITTENDENAAM in de $velden lijst van GetLogboek() in class.Startlijst.inc.php.
   // PHP gebruikt hiervoor CONCAT(lidNaam, '(', vrijeTekst, ')'), en MySQL's CONCAT() geeft NULL terug zodra
   // een van de argumenten NULL is - dat gedrag wordt hier expliciet nagebootst
   private CombineerNaam(lidNaam: string | null, vrijeTekst: string | null): string | null
   {
      if (!vrijeTekst) return lidNaam;
      return lidNaam === null ? null : `${lidNaam}(${vrijeTekst})`;
   }

   // logboek van een vliegtuig: per gevlogen dag het aantal starts, lierstarts, sleepstarts en de totale
   // vliegtijd, zie GetVliegtuigLogboek() in class.Startlijst.inc.php. De privacy-check (CLUBKIST / recent
   // zelf gevlogen / beheerder-achtige rol) gebeurt in de controller, waar currentUser beschikbaar is - deze
   // functie krijgt het REG_CALL van het vliegtuig al aangeleverd (elke rij heeft toch hetzelfde vliegtuig).
   async GetVliegtuigLogboek(params: GetVliegtuigLogboekRequest, regCall: string): Promise<IHeliosGetObjectsResponse<GetVliegtuigLogboekResponse>>
   {
      this.logger.verbose(`StartlijstService.GetVliegtuigLogboek(${safeStringify({params, regCall})})`);

      // zonder BEGIN_DATUM/EIND_DATUM valt GetVliegtuigLogboek() in PHP terug op het huidige kalenderjaar -
      // dat is toevallig ook precies VanTot()'s eigen standaardgedrag, dus geen speciale behandeling nodig
      // zoals bij GetLogboek()
      const dtSpanne = params.VanTot(params.DATUM, params.BEGIN_DATUM, params.EIND_DATUM);

      const vluchten = await this.dbService.operStartlijst.findMany({
         where: {
            VERWIJDERD: false,
            VLIEGTUIG_ID: params.ID,
            STARTTIJD: {not: null},
            LANDINGSTIJD: {not: null},
            DATUM: {gte: dtSpanne.start, lte: dtSpanne.eind},
         },
         select: {DATUM: true, STARTTIJD: true, LANDINGSTIJD: true, STARTMETHODE_ID: true},
      });

      const perDag = new Map<number, {vluchten: number, lierstarts: number, sleepstarts: number, minuten: number}>();
      for (const vlucht of vluchten)
      {
         const dag = vlucht.DATUM.getTime();
         const stats = perDag.get(dag) ?? {vluchten: 0, lierstarts: 0, sleepstarts: 0, minuten: 0};
         stats.vluchten++;
         // PHP: STARTMETHODE_ID >= 550 (lieren is de hoogste ID in gebruik, dus functioneel gelijk aan "=550")
         if ((vlucht.STARTMETHODE_ID ?? 0) >= StartMethode.Lieren)
            stats.lierstarts++;
         if (vlucht.STARTMETHODE_ID === StartMethode.Slepen)
            stats.sleepstarts++;
         stats.minuten += this.BerekenDuurMinutes(vlucht.DATUM, vlucht.STARTTIJD, vlucht.LANDINGSTIJD) ?? 0;
         perDag.set(dag, stats);
      }

      // totaal = aantal gevlogen dagen (COUNT(DISTINCT(DATUM)) in PHP), vóór MAX/START paginering
      const totaal = perDag.size;

      let dagen = [...perDag.entries()]
         .sort(([a], [b]) => b - a) // DATUM DESC
         .map(([dag, stats]) => ({
            DATUM: toDateOnly(new Date(dag)) as unknown as Date,
            VLUCHTEN: stats.vluchten,
            LIERSTARTS: stats.lierstarts,
            SLEEPSTARTS: stats.sleepstarts,
            VLIEGTIJD: MinutenNaarTijd(stats.minuten),
            REG_CALL: regCall,
         } as GetVliegtuigLogboekResponse));

      if (params.MAX !== undefined || params.START !== undefined)
      {
         const start = params.START ?? 0;
         dagen = dagen.slice(start, params.MAX !== undefined ? start + params.MAX : undefined);
      }

      const result = this.buildGetObjectsResponse(dagen, totaal, params.HASH);
      this.logger.verbose(`StartlijstService.GetVliegtuigLogboek() => ${safeStringify(result)}`);
      return result;
   }

   // logboek-totalen van een vliegtuig per maand, voor een heel jaar (standaard het huidige jaar), altijd 12
   // maanden (leeg gevuld waar niet gevlogen is) plus een totaal over het hele jaar, zie
   // GetVliegtuigLogboekTotalen() in class.Startlijst.inc.php. Zelfde privacy-check als GetVliegtuigLogboek()
   // hierboven (gebeurt in de controller), en hergebruikt daarom ook HeeftRecentGevlogen() hieronder.
   async GetVliegtuigLogboekTotalen(params: GetVliegtuigLogboekTotalenRequest, regCall: string): Promise<GetVliegtuigLogboekTotalenResponse>
   {
      this.logger.verbose(`StartlijstService.GetVliegtuigLogboekTotalen(${safeStringify({params, regCall})})`);

      const jaar = params.JAAR ?? new Date().getFullYear();
      const jaarStart = new Date(Date.UTC(jaar, 0, 1));
      const jaarEind = new Date(Date.UTC(jaar, 11, 31));

      const vluchten = await this.dbService.operStartlijst.findMany({
         where: {
            VERWIJDERD: false,
            VLIEGTUIG_ID: params.ID,
            STARTTIJD: {not: null},
            LANDINGSTIJD: {not: null},
            DATUM: {gte: jaarStart, lte: jaarEind},
         },
         select: {DATUM: true, STARTTIJD: true, LANDINGSTIJD: true, STARTMETHODE_ID: true},
      });

      const perMaand = new Map<number, {vluchten: number, lierstarts: number, sleepstarts: number, minuten: number}>();
      for (const vlucht of vluchten)
      {
         const maand = vlucht.DATUM.getUTCMonth() + 1;
         const stats = perMaand.get(maand) ?? {vluchten: 0, lierstarts: 0, sleepstarts: 0, minuten: 0};
         stats.vluchten++;
         // PHP: STARTMETHODE_ID >= 550 (lieren is de hoogste ID in gebruik, dus functioneel gelijk aan "=550")
         if ((vlucht.STARTMETHODE_ID ?? 0) >= StartMethode.Lieren)
            stats.lierstarts++;
         if (vlucht.STARTMETHODE_ID === StartMethode.Slepen)
            stats.sleepstarts++;
         stats.minuten += this.BerekenDuurMinutes(vlucht.DATUM, vlucht.STARTTIJD, vlucht.LANDINGSTIJD) ?? 0;
         perMaand.set(maand, stats);
      }

      const maanden: GetVliegtuigLogboekTotalenMaandResponse[] = [];
      let totaalVluchten = 0, totaalLierstarts = 0, totaalSleepstarts = 0, totaalMinuten = 0;
      for (let maand = 1; maand <= 12; maand++)
      {
         const stats = perMaand.get(maand) ?? {vluchten: 0, lierstarts: 0, sleepstarts: 0, minuten: 0};
         maanden.push({
            MAAND: maand,
            VLUCHTEN: stats.vluchten,
            LIERSTARTS: stats.lierstarts,
            SLEEPSTARTS: stats.sleepstarts,
            // PHP formatteert dit veld hier als HH:mm:ss (SEC_TO_TIME), anders dan de HH:mm van GetVliegtuigLogboek()
            VLIEGTIJD: `${MinutenNaarTijd(stats.minuten)}:00`,
            REG_CALL: stats.vluchten > 0 ? regCall : '',
         });
         totaalVluchten += stats.vluchten;
         totaalLierstarts += stats.lierstarts;
         totaalSleepstarts += stats.sleepstarts;
         totaalMinuten += stats.minuten;
      }

      const totalen: GetVliegtuigLogboekTotalenJaarResponse = {
         VLUCHTEN: totaalVluchten,
         LIERSTARTS: totaalLierstarts,
         SLEEPSTARTS: totaalSleepstarts,
         VLIEGTIJD: `${MinutenNaarTijd(totaalMinuten)}:00`,
      };

      const basis = this.buildGetObjectsResponse(maanden, maanden.length, params.HASH);
      const result: GetVliegtuigLogboekTotalenResponse = {...basis, totalen};
      this.logger.verbose(`StartlijstService.GetVliegtuigLogboekTotalen() => ${safeStringify(result)}`);
      return result;
   }

   // heeft dit lid in de afgelopen 6 maanden als vlieger op dit vliegtuig gevlogen? Rechtstreekse query op
   // oper_startlijst, gebruikt in de privacy-check van GetVliegtuigLogboek() in class.Startlijst.inc.php
   async HeeftRecentGevlogen(lidId: number, vliegtuigId: number): Promise<boolean>
   {
      this.logger.verbose(`StartlijstService.HeeftRecentGevlogen(${safeStringify({lidId, vliegtuigId})})`);
      const zesMaandenGeleden = new Date();
      zesMaandenGeleden.setMonth(zesMaandenGeleden.getMonth() - 6);

      const aantal = await this.dbService.operStartlijst.count({
         where: {
            VERWIJDERD: false,
            STARTTIJD: {not: null},
            VLIEGTUIG_ID: vliegtuigId,
            VLIEGER_ID: lidId,
            DATUM: {gt: zesMaandenGeleden},
         }
      });
      const result = aantal > 0;
      this.logger.verbose(`StartlijstService.HeeftRecentGevlogen() => ${safeStringify(result)}`);
      return result;
   }

   // Is dit lid op dit moment aan het vliegen op deze datum, als vlieger of als inzittende?
   async LidVliegt(lidId: number, datum: Date): Promise<boolean>
   {
      this.logger.verbose(`StartlijstService.LidVliegt(${safeStringify({lidId, datum})})`);
      const openeStart = await this.dbService.operStartlijst.findFirst({
         where: {
            DATUM: datum,
            VERWIJDERD: false,
            LANDINGSTIJD: null,
            OR: [
               {VLIEGER_ID: lidId},
               {INZITTENDE_ID: lidId},
            ],
         },
         select: {ID: true}
      });
      const result = openeStart !== null;
      this.logger.verbose(`StartlijstService.LidVliegt() => ${safeStringify(result)}`);
      return result;
   }

   // Is dit vliegtuig op dit moment aan het vliegen op deze datum?
   async VliegtuigVliegt(vliegtuigId: number, datum: Date): Promise<boolean>
   {
      this.logger.verbose(`StartlijstService.VliegtuigVliegt(${safeStringify({vliegtuigId, datum})})`);
      const openeStart = await this.dbService.operStartlijst.findFirst({
         where: {
            DATUM: datum,
            VERWIJDERD: false,
            LANDINGSTIJD: null,
            VLIEGTUIG_ID: vliegtuigId,
         },
         select: {ID: true}
      });
      const result = openeStart !== null;
      this.logger.verbose(`StartlijstService.VliegtuigVliegt() => ${safeStringify(result)}`);
      return result;
   }

   // Totale vliegtijd (in minuten) van dit lid als vlieger (niet als inzittende) op deze datum, over al zijn
   // starts die dag. Rechtstreekse query op oper_startlijst i.p.v. via GetObjects(), zelfde reden als
   // LidVliegt() hierboven. Per start wordt de duur berekend via BerekenDuurMinutes() (zie DUUR in de
   // startlijst_view) - zonder LANDINGSTIJD telt een start dus mee tot "nu" als het vandaag is, of tot de
   // zonsondergang op Vliegveld Terlet als het een historische datum betreft.
   async LidVliegtijd(lidId: number, datum: Date): Promise<number>
   {
      this.logger.verbose(`StartlijstService.LidVliegtijd(${safeStringify({lidId, datum})})`);
      const vluchten = await this.dbService.operStartlijst.findMany({
         where: {
            DATUM: datum,
            VERWIJDERD: false,
            VLIEGER_ID: lidId,
            STARTTIJD: {not: null},
         },
         select: {STARTTIJD: true, LANDINGSTIJD: true}
      });

      const totaalMinuten = vluchten.reduce((totaal, vlucht) =>
         totaal + (this.BerekenDuurMinutes(datum, vlucht.STARTTIJD, vlucht.LANDINGSTIJD) ?? 0), 0);

      const result = totaalMinuten;
      this.logger.verbose(`StartlijstService.LidVliegtijd() => ${safeStringify(result)}`);
      return result;
   }

   // Aantal starts van dit lid als vlieger (niet als inzittende) op deze datum - telt ook een start zonder
   // STARTTIJD mee (nog niet vertrokken, wel al op de startlijst). Rechtstreekse COUNT-query op oper_startlijst
   // i.p.v. via GetObjects(), zelfde reden als LidVliegt()/LidVliegtijd() hierboven.
   async LidStarts(lidId: number, datum: Date): Promise<number>
   {
      this.logger.verbose(`StartlijstService.LidStarts(${safeStringify({lidId, datum})})`);
      const result = await this.dbService.operStartlijst.count({
         where: {
            DATUM: datum,
            VERWIJDERD: false,
            VLIEGER_ID: lidId,
         }
      });
      this.logger.verbose(`StartlijstService.LidStarts() => ${safeStringify(result)}`);
      return result;
   }

   // vliegcurrency-indicator (rood/geel/groen) per lid over de laatste 26 weken, gebaseerd op de gewogen
   // gemiddelde van vlieguren en starts - zelfde barometerformule als STATUS_BAROMETER in GetRecency() hieronder.
   // Rechtstreekse, gebatchte query op oper_startlijst i.p.v. via GetObjects() voor meerdere leden tegelijk.
   async GetStatusBarometers(leden: {LID_ID: number, INSTRUCTEUR?: boolean}[]): Promise<Map<number, string>>
   {
      this.logger.verbose(`StartlijstService.GetStatusBarometers(${safeStringify({leden})})`);
      const lidIds = [...new Set(leden.map(lid => lid.LID_ID))];
      const instructeurIds = [...new Set(leden.filter(lid => lid.INSTRUCTEUR).map(lid => lid.LID_ID))];

      const vandaagDatum = DatumZonderTijd(new Date());
      const windowStart = new Date(vandaagDatum);
      windowStart.setUTCDate(windowStart.getUTCDate() - 182); // laatste 26 weken

      const or: Prisma.OperStartlijstWhereInput[] = [{VLIEGER_ID: {in: lidIds}}];
      if (instructeurIds.length > 0)
         or.push({INZITTENDE_ID: {in: instructeurIds}, INSTRUCTIEVLUCHT: true});

      const vluchten = await this.dbService.operStartlijst.findMany({
         where: {
            VERWIJDERD: false,
            DATUM: {gt: windowStart, lte: vandaagDatum},
            STARTTIJD: {not: null},
            LANDINGSTIJD: {not: null},
            OR: or,
         },
         select: {DATUM: true, STARTTIJD: true, LANDINGSTIJD: true, VLIEGER_ID: true, INZITTENDE_ID: true, INSTRUCTIEVLUCHT: true},
      });

      const lidIdSet = new Set(lidIds);
      const instructeurIdSet = new Set(instructeurIds);
      const perLid = new Map<number, {starts: number, minuten: number}>();
      const voegVluchtToe = (lidId: number, datum: Date, starttijd: Date, landingstijd: Date) =>
      {
         const stats = perLid.get(lidId) ?? {starts: 0, minuten: 0};
         stats.starts++;
         stats.minuten += this.BerekenDuurMinutes(datum, starttijd, landingstijd) ?? 0;
         perLid.set(lidId, stats);
      };

      for (const vlucht of vluchten)
      {
         if (vlucht.VLIEGER_ID !== null && lidIdSet.has(vlucht.VLIEGER_ID))
            voegVluchtToe(vlucht.VLIEGER_ID, vlucht.DATUM, vlucht.STARTTIJD, vlucht.LANDINGSTIJD);
         if (vlucht.INSTRUCTIEVLUCHT && vlucht.INZITTENDE_ID !== null && instructeurIdSet.has(vlucht.INZITTENDE_ID))
            voegVluchtToe(vlucht.INZITTENDE_ID, vlucht.DATUM, vlucht.STARTTIJD, vlucht.LANDINGSTIJD);
      }

      const barometers = new Map<number, string>();
      for (const lidId of lidIds)
      {
         const stats = perLid.get(lidId) ?? {starts: 0, minuten: 0};
         const gemiddelde = (stats.minuten / 60 + stats.starts * 25 / 35) / 2;
         barometers.set(lidId, gemiddelde < 10 ? 'rood' : gemiddelde < 20 ? 'geel' : 'groen');
      }
      const result = barometers;
      this.logger.verbose(`StartlijstService.GetStatusBarometers() => ${safeStringify(result)}`);
      return result;
   }

   // vliegcurrency-statistieken van een lid, zie GetRecency() in class.Startlijst.inc.php. Rechtstreekse
   // query op oper_startlijst i.p.v. via GetObjects(), zelfde reden als LidVliegt()/LidVliegtijd() hierboven -
   // dit is een enkele, in zichzelf staande lookup voor 1 vlieger.
   async GetRecency(vliegerId: number, datum?: Date, inclusiefInstructie: boolean = true, alleenClubKisten: boolean = false): Promise<RecencyResponse>
   {
      this.logger.verbose(`StartlijstService.GetRecency(${safeStringify({vliegerId, datum, inclusiefInstructie, alleenClubKisten})})`);

      const lid = await this.dbService.refLid.findUnique({where: {ID: vliegerId}, select: {INSTRUCTEUR: true}});
      if (!lid)
         throw new HttpException(`Lid met ID ${vliegerId} niet gevonden`, HttpStatus.NOT_FOUND);

      // peildatum zonder tijd-component (UTC-middernacht, net als DATUM op oper_startlijst)
      const peilDatumZonderTijd = DatumZonderTijd(datum ?? new Date());

      // periode: vanaf 1 januari, 2 jaar voor het jaar van de peildatum, t/m de peildatum
      const periodeStart = new Date(Date.UTC(peilDatumZonderTijd.getUTCFullYear() - 2, 0, 1));

      const or: Prisma.OperStartlijstWhereInput[] = [{VLIEGER_ID: vliegerId}];
      if (lid.INSTRUCTEUR && inclusiefInstructie)
         or.push({INZITTENDE_ID: vliegerId, INSTRUCTIEVLUCHT: true});

      const vluchten = await this.dbService.operStartlijst.findMany({
         where: {
            // PHP's eigen SQL filtert hier niet op VERWIJDERD (vermoedelijk een omissie) - hier bewust wel
            // gefilterd, consistent met alle andere Startlijst-queries in deze applicatie
            VERWIJDERD: false,
            DATUM: {gt: periodeStart, lte: peilDatumZonderTijd},
            STARTTIJD: {not: null},
            LANDINGSTIJD: {not: null},
            OR: or,
            ...(alleenClubKisten ? {Vliegtuig: {CLUBKIST: true}} : {}),
         },
         orderBy: {DATUM: 'desc'},
         select: {DATUM: true, STARTTIJD: true, LANDINGSTIJD: true, VLIEGER_ID: true, CHECKSTART: true, STARTMETHODE_ID: true},
      });

      let startsDrieMnd = 0, startsBarometer = 0, starts24Mnd = 0, startsDitJaar = 0, startsVorigJaar = 0;
      let urenDrieMnd = 0, urenBarometer = 0, uren24Mnd = 0, urenDitJaar = 0, urenVorigJaar = 0;
      let lierstarts = 0, sleepstarts = 0, zelfstarts = 0, tmgstarts = 0;
      const checks: string[] = [];
      // PHP gebruikt hier Date("Y") (het huidige kalenderjaar op het moment van de aanroep), niet het jaar
      // van $datum - dit is bewust letterlijk overgenomen (zie GetRecency() in class.Startlijst.inc.php,
      // regels 1712/1717), ook al lijkt dit een omissie t.o.v. de rest van de functie die wel $dateTime gebruikt
      const huidigJaar = new Date().getFullYear();

      for (const vlucht of vluchten)
      {
         // STARTTIJD/LANDINGSTIJD zijn hier altijd gezet (zie WHERE hierboven), dus BerekenDuurMinutes()
         // raakt nooit de "nu"/zonsondergang-fallback voor een ontbrekende landingstijd
         const duurMinuten = this.BerekenDuurMinutes(vlucht.DATUM, vlucht.STARTTIJD, vlucht.LANDINGSTIJD) ?? 0;
         const diffDagen = Math.round((peilDatumZonderTijd.getTime() - vlucht.DATUM.getTime()) / 86400000);

         if (diffDagen < 13 * 7)
         {
            startsDrieMnd++;
            urenDrieMnd += duurMinuten;
         }
         if (diffDagen <= 26 * 7)
         {
            startsBarometer++;
            urenBarometer += duurMinuten;
         }
         if (diffDagen < 7 * 104)
         {
            if (vlucht.CHECKSTART && vlucht.VLIEGER_ID === vliegerId)
               checks.push(this.FormatteerDatumDMY(vlucht.DATUM));

            switch (vlucht.STARTMETHODE_ID)
            {
               case StartMethode.Slepen: sleepstarts++; break;
               case StartMethode.Zelfstart: zelfstarts++; break;
               case StartMethode.TMG: tmgstarts++; break;
               case StartMethode.Lieren: lierstarts++; break;
            }
            starts24Mnd++;
            uren24Mnd += duurMinuten;
         }
         if (vlucht.DATUM.getUTCFullYear() === huidigJaar)
         {
            startsDitJaar++;
            urenDitJaar += duurMinuten;
         }
         if (vlucht.DATUM.getUTCFullYear() === huidigJaar - 1)
         {
            startsVorigJaar++;
            urenVorigJaar += duurMinuten;
         }
      }

      // zelfde barometerformule als GetStatusBarometers()
      const gemiddelde = (urenBarometer / 60 + startsBarometer * 25 / 35) / 2;
      const statusBarometer = gemiddelde < 10 ? 'rood' : gemiddelde < 20 ? 'geel' : 'groen';

      let startsInstructie = -1;
      let urenInstructie = 0;
      if (lid.INSTRUCTEUR)
      {
         startsInstructie = 0;
         const instructiePeriodeStart = new Date(peilDatumZonderTijd);
         instructiePeriodeStart.setUTCFullYear(instructiePeriodeStart.getUTCFullYear() - 3);

         const instructieVluchten = await this.dbService.operStartlijst.findMany({
            where: {
               VERWIJDERD: false,
               DATUM: {gt: instructiePeriodeStart, lte: peilDatumZonderTijd},
               STARTTIJD: {not: null},
               LANDINGSTIJD: {not: null},
               INSTRUCTIEVLUCHT: true,
               INZITTENDE_ID: vliegerId,
            },
            select: {DATUM: true, STARTTIJD: true, LANDINGSTIJD: true},
         });

         for (const vlucht of instructieVluchten)
         {
            startsInstructie++;
            urenInstructie += this.BerekenDuurMinutes(vlucht.DATUM, vlucht.STARTTIJD, vlucht.LANDINGSTIJD) ?? 0;
         }
      }

      const result: RecencyResponse = {
         STARTS_DRIE_MND: startsDrieMnd,
         STARTS_24_MND: starts24Mnd,
         STARTS_VORIG_JAAR: startsVorigJaar,
         STARTS_DIT_JAAR: startsDitJaar,
         STARTS_INSTRUCTIE: startsInstructie,
         UREN_DRIE_MND: this.FormatteerUren(urenDrieMnd),
         UREN_24_MND: this.FormatteerUren(uren24Mnd),
         UREN_VORIG_JAAR: this.FormatteerUren(urenVorigJaar),
         UREN_DIT_JAAR: this.FormatteerUren(urenDitJaar),
         UREN_INSTRUCTIE: this.FormatteerUren(urenInstructie),
         STATUS_BAROMETER: statusBarometer,
         WAARDE: Math.trunc(gemiddelde * 10) / 10, // intval(), niet round() - zie class.Startlijst.inc.php
         STARTS_BAROMETER: startsBarometer,
         UREN_BAROMETER: this.FormatteerUren(urenBarometer),
         LIERSTARTS: lierstarts,
         SLEEPSTARTS: sleepstarts,
         ZELFSTARTS: zelfstarts,
         TMGSTARTS: tmgstarts,
         CHECKS: checks,
      };
      this.logger.verbose(`StartlijstService.GetRecency() => ${safeStringify(result)}`);
      return result;
   }

   // formatteert minuten als "H:MM" (uren niet met voorloopnul, anders dan BerekenDuurString), zie GetRecency()
   // in class.Startlijst.inc.php
   private FormatteerUren(minuten: number): string
   {
      const uren = Math.trunc(minuten / 60);
      const resterendeMinuten = Math.round(minuten % 60);
      return `${uren}:${String(resterendeMinuten).padStart(2, '0')}`;
   }

   // formatteert een datum als "dd-mm-jjjj", zie de CHECKS lijst in GetRecency() in class.Startlijst.inc.php
   private FormatteerDatumDMY(datum: Date): string
   {
      return `${String(datum.getUTCDate()).padStart(2, '0')}-${String(datum.getUTCMonth() + 1).padStart(2, '0')}-${datum.getUTCFullYear()}`;
   }

   // datums waarop een DDWV bedrijf gepland staat, via oper_daginfo of oper_rooster (zie startlijst_view)
   private async DDWVDatums(): Promise<Date[]>
   {
      this.logger.verbose(`StartlijstService.DDWVDatums()`);
      const [daginfo, rooster] = await Promise.all([
         this.dbService.operDagInfo.findMany({where: {DDWV: true}, select: {DATUM: true}}),
         this.dbService.operRooster.findMany({where: {DDWV: true}, select: {DATUM: true}}),
      ]);
      const result = [...daginfo, ...rooster].map(record => record.DATUM);
      this.logger.verbose(`StartlijstService.DDWVDatums() => ${safeStringify(result)}`);
      return result;
   }

   // maak de dataset voor de GetObjects response, inclusief de relaties met andere tabellen: vliegtuig-, lid-, en type-gegevens via joins,
   // de berekende vliegduur, en de DDWV vlag via een gebatchte datum-lookup op oper_daginfo/oper_rooster
   private async MaakGetObjectsResponseDataset(objs: StartlijstMetRelaties[]): Promise<GetObjectsOperStartlijstResponse[]>
   {
      this.logger.verbose(`StartlijstService.MaakGetObjectsResponseDataset(${safeStringify({objs})})`);
      if (objs.length === 0)
      {
         const result: GetObjectsOperStartlijstResponse[] = [];
         this.logger.verbose(`StartlijstService.MaakGetObjectsResponseDataset() => ${safeStringify(result)}`);
         return result;
      }

      const ddwvDatums = new Set((await this.DDWVDatums()).map(datum => datum.getTime()));

      const result = objs.map(obj =>
      {
         const {Vliegtuig: vliegtuig, Sleepkist: sleepkist, Vlieger: vlieger, Inzittende: inzittende,
            Startmethode: startmethode, Veld: veld, Baan: baan, ...startlijst} = obj;

         return {
            ...startlijst,
            DATUM: toDateOnly(startlijst.DATUM) as unknown as Date,
            STARTTIJD: toTimeOnly(startlijst.STARTTIJD) as unknown as Date,
            LANDINGSTIJD: toTimeOnly(startlijst.LANDINGSTIJD) as unknown as Date,
            REGISTRATIE: vliegtuig.REGISTRATIE,
            CALLSIGN: vliegtuig.CALLSIGN,
            REG_CALL: RegCall(vliegtuig.REGISTRATIE, vliegtuig.CALLSIGN),
            CLUBKIST: vliegtuig.CLUBKIST,
            VLIEGTUIG_TYPE_ID: vliegtuig.TYPE_ID,
            VLIEGTUIGTYPE: vliegtuig.VliegtuigType?.OMSCHRIJVING ?? null,
            SLEEPKIST: sleepkist ? RegCall(sleepkist.REGISTRATIE, sleepkist.CALLSIGN) : null,
            VLIEGERNAAM_LID: vlieger?.NAAM ?? null,
            INZITTENDENAAM_LID: inzittende?.NAAM ?? null,
            VLIEGER_LIDTYPE_ID: vlieger?.LIDTYPE_ID ?? null,
            INZITTENDE_LIDTYPE_ID: inzittende?.LIDTYPE_ID ?? null,
            STARTMETHODE: startmethode?.OMSCHRIJVING ?? null,
            VELD: veld?.OMSCHRIJVING ?? null,
            BAAN: baan?.CODE ?? null,
            DUUR: this.BerekenDuurString(startlijst.DATUM, startlijst.STARTTIJD, startlijst.LANDINGSTIJD),
            DDWV: ddwvDatums.has(startlijst.DATUM.getTime()),
         } as GetObjectsOperStartlijstResponse;
      });
      this.logger.verbose(`StartlijstService.MaakGetObjectsResponseDataset() => ${safeStringify(result)}`);
      return result;
   }

   // zie DUUR berekening in de startlijst_view: verstreken tijd tot nu (als het vandaag is en nog niet geland),
   // of het verschil tussen start- en landingstijd, of null als er nog geen landingstijd is op een andere dag
   private BerekenDuurMinutes(datum: Date, starttijd: Date | null, landingstijd: Date | null): number | null
   {
      this.logger.verbose(`StartlijstService.BerekenDuurMinutes(${safeStringify({datum, starttijd, landingstijd})})`);
      if (!starttijd)
      {
         const result = null;
         this.logger.verbose(`StartlijstService.BerekenDuurMinutes() => ${safeStringify(result)}`);
         return result;
      }

      const vandaag = new Date();
      const isVandaag = datum.toDateString() === vandaag.toDateString();

      let eindTijd: Date | null = landingstijd;
      if (!eindTijd)
      {
         // geen landingstijd: voor vandaag de huidige tijd gebruiken, voor een historische datum de
         // zonsondergang op Vliegveld Terlet die dag (bij benadering - er is dan immers geen geland gemeld)
         eindTijd = isVandaag ? vandaag : getSunset(TERLET_LATITUDE, TERLET_LONGITUDE, datum);
      }

      const result = Math.max(0, Math.round((this.MinutenSindsMiddernacht(eindTijd) - this.MinutenSindsMiddernacht(starttijd) + 1440) % 1440));
      this.logger.verbose(`StartlijstService.BerekenDuurMinutes() => ${safeStringify(result)}`);
      return result;
   }

   // formatteert de vliegduur (zie BerekenDuurMinutes) als "HH:mm" string voor de startlijst_view, leeg als de
   // duur (nog) niet te berekenen is
   private BerekenDuurString(datum: Date, starttijd: Date | null, landingstijd: Date | null): string
   {
      this.logger.verbose(`StartlijstService.BerekenDuurString(${safeStringify({datum, starttijd, landingstijd})})`);
      const minuten = this.BerekenDuurMinutes(datum, starttijd, landingstijd);
      const result = minuten === null ? '' : `${String(Math.floor(minuten / 60)).padStart(2, '0')}:${String(minuten % 60).padStart(2, '0')}`;
      this.logger.verbose(`StartlijstService.BerekenDuurString() => ${safeStringify(result)}`);
      return result;
   }

   private MinutenSindsMiddernacht(tijd: Date): number
   {
      this.logger.verbose(`StartlijstService.MinutenSindsMiddernacht(${safeStringify({tijd})})`);
      const result = tijd.getUTCHours() * 60 + tijd.getUTCMinutes();
      this.logger.verbose(`StartlijstService.MinutenSindsMiddernacht() => ${safeStringify(result)}`);
      return result;
   }

   // bepaalt het volgnummer van de vlucht op die dag, zie NieuwDagNummer() in class.Startlijst.inc.php
   private async NieuwDagNummer(datum: Date): Promise<number>
   {
      this.logger.verbose(`StartlijstService.NieuwDagNummer(${safeStringify({datum})})`);
      const laatste = await this.dbService.operStartlijst.findFirst({
         where: {DATUM: datum},
         orderBy: {DAGNUMMER: 'desc'},
      });
      const result = (laatste?.DAGNUMMER ?? 0) + 1;
      this.logger.verbose(`StartlijstService.NieuwDagNummer() => ${safeStringify(result)}`);
      return result;
   }

   // controleert of start- en landingstijd geldig zijn, zie StartLandingTijdenValidatie() in class.Startlijst.inc.php
   private ValideerStartLandingTijden(starttijd: Date | null | undefined, landingstijd: Date | null | undefined): void
   {
      this.logger.verbose(`StartlijstService.ValideerStartLandingTijden(${safeStringify({starttijd, landingstijd})})`);
      if (starttijd === undefined || landingstijd === undefined) return; // niet allebei opgegeven, niets te doen

      if (starttijd == null && landingstijd != null)
         throw new HttpException("Starttijd ontbreekt", HttpStatus.BAD_REQUEST);

      if (starttijd != null && landingstijd != null)
      {
         if (this.MinutenSindsMiddernacht(landingstijd) <= this.MinutenSindsMiddernacht(starttijd))
            throw new HttpException(`Landingstijd moet later zijn dan de starttijd`, HttpStatus.CONFLICT);
      }
   }

   // een instructievlucht kan niet in een eenzitter, en vereist een instructeur als inzittende,
   // zie InstructieVlucht() in class.Startlijst.inc.php
   private async ValideerInstructieVlucht(vliegtuigId: number | undefined, inzittendeId: number | null | undefined, instructievlucht: boolean | undefined): Promise<boolean | undefined>
   {
      this.logger.verbose(`StartlijstService.ValideerInstructieVlucht(${safeStringify({vliegtuigId, inzittendeId, instructievlucht})})`);
      if (vliegtuigId !== undefined)
      {
         const vliegtuig = await this.dbService.refVliegtuig.findUnique({where: {ID: vliegtuigId}});
         if (vliegtuig?.ZITPLAATSEN === 1)
         {
            const result = false; // eenzitter, kan nooit een instructievlucht zijn
            this.logger.verbose(`StartlijstService.ValideerInstructieVlucht() => ${safeStringify(result)}`);
            return result;
         }
      }

      if (instructievlucht && inzittendeId != null)
      {
         const inzittende = await this.dbService.refLid.findUnique({where: {ID: inzittendeId}});
         if (!inzittende?.INSTRUCTEUR)
            throw new HttpException("Instructie vlucht kan alleen door een instructeur worden gedaan", HttpStatus.CONFLICT);
      }

      const result = instructievlucht;
      this.logger.verbose(`StartlijstService.ValideerInstructieVlucht() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.OperStartlijstUncheckedCreateInput, actorId: number): Promise<OperStartlijst>
   {
      this.logger.verbose(`StartlijstService.AddObject(${safeStringify({data})})`);
      this.ValideerStartLandingTijden(data.STARTTIJD as Date | null | undefined, data.LANDINGSTIJD as Date | null | undefined);

      const instructievlucht = await this.ValideerInstructieVlucht(data.VLIEGTUIG_ID, data.INZITTENDE_ID, data.INSTRUCTIEVLUCHT as boolean | undefined);
      if (instructievlucht !== undefined)
         data.INSTRUCTIEVLUCHT = instructievlucht;

      data.DAGNUMMER = await this.NieuwDagNummer(data.DATUM as Date);

      const obj = await this.dbService.operStartlijst.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj, actorId);
      this.logger.verbose(`StartlijstService.AddObject() => ${safeStringify(obj)}`);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.OperStartlijstUncheckedUpdateInput, actorId: number): Promise<OperStartlijst>
   {
      this.logger.verbose(`StartlijstService.UpdateObject(${safeStringify({id, data})})`);
      const db = await this.GetObject(id);

      const nieuweStarttijd = data.STARTTIJD !== undefined ? data.STARTTIJD as Date | null : db.STARTTIJD;
      const nieuweLandingstijd = data.LANDINGSTIJD !== undefined ? data.LANDINGSTIJD as Date | null : db.LANDINGSTIJD;
      this.ValideerStartLandingTijden(nieuweStarttijd, nieuweLandingstijd);

      const nieuweInzittende = data.INZITTENDE_ID !== undefined ? data.INZITTENDE_ID as number | null : db.INZITTENDE_ID;
      const nieuweInstructievlucht = data.INSTRUCTIEVLUCHT !== undefined ? data.INSTRUCTIEVLUCHT as boolean : undefined;
      const instructievlucht = await this.ValideerInstructieVlucht(data.VLIEGTUIG_ID as number | undefined, nieuweInzittende, nieuweInstructievlucht);
      if (instructievlucht !== undefined)
         data.INSTRUCTIEVLUCHT = instructievlucht;

      // als de datum aangepast is, dan een nieuw dagnummer toekennen, zie UpdateObject() in class.Startlijst.inc.php
      const nieuweDatum = data.DATUM as Date | undefined;
      if (nieuweDatum !== undefined && nieuweDatum.valueOf() !== db.DATUM.valueOf())
         data.DAGNUMMER = await this.NieuwDagNummer(nieuweDatum);

      const obj = await this.dbService.operStartlijst.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id, db, data, obj, actorId);
      this.logger.verbose(`StartlijstService.UpdateObject() => ${safeStringify(obj)}`);
      return obj;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`StartlijstService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.operStartlijst.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db, actorId);
   }
}