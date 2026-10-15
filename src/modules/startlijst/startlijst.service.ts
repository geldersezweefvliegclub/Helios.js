import {forwardRef, HttpException, HttpStatus, Inject, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperStartlijst, RefLid} from "@prisma/client";
import {GetObjectsOperStartlijstRequest} from "./GetObjectsOperStartlijstRequest";
import {GetObjectsOperStartlijstResponse} from "./GetObjectsOperStartlijstResponse";
import {safeStringify} from "../../core/helpers/LogHelper";
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";
import {DatumZonderTijd, MinutenNaarTijd, toDateOnly, toTimeHHmm} from "../../core/helpers/TimeDate";
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
import {GetLogboekTotalenRequest} from "./GetLogboekTotalenRequest";
import {
   GetLogboekTotalenResponse,
   GetLogboekTotalenStartsResponse,
   GetLogboekTotalenVliegtuigResponse
} from "./GetLogboekTotalenResponse";
import {GetVliegDagenRequest} from "./GetVliegDagenRequest";
import {GetVliegDagenResponse} from "./GetVliegDagenResponse";
import {crc32} from "js-crc";
import {AanwezigLedenService} from "../aanwezig-leden/aanwezig-leden.service";
import {AanwezigVliegtuigenService} from "../aanwezig-vliegtuigen/aanwezig-vliegtuigen.service";
import {LedenService} from "../leden/leden.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {RoosterService} from "../rooster/rooster.service";
import {VliegtuigenService} from "../vliegtuigen/vliegtuigen.service";
import {LidType} from "../../core/enums/LidType";
import {Vliegveld} from "../../core/enums/Vliegveld";

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

// beperking van de dataset van GetObjects() en GetVliegDagen() voor gebruikers zonder volledige toegang, bepaald in
// de controller (zie GetObjects()/GetVliegDagen() in class.Startlijst.inc.php)
export interface StartlijstBeperking
{
   LID_ID?: number;     // alleen vluchten met dit lid als vlieger of inzittende ...
   DATUMS?: Date[];     // ... of op een van deze datums (DDWV dagen voor beheerder DDWV / DDWV crew)
   DATUM?: Date;        // alleen vluchten op deze datum (starttoren: vandaag)
}

// een vliegdag tijdens het groeperen en sorteren in GetVliegDagen(): DATUM als timestamp, vliegtijd in minuten
interface VliegDag
{
   DATUM: number;
   STARTS: number;
   MINUTEN: number | null;
}

@Injectable()
export class StartlijstService extends IHeliosService
{
   private readonly logger = new Logger(StartlijstService.name);

   // AanwezigLedenService en AanwezigVliegtuigenService injecteren op hun beurt StartlijstService - forwardRef() is
   // hier dus aan beide kanten nodig om deze cirkelverwijzingen op te lossen
   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2,
               @Inject(forwardRef(() => AanwezigLedenService)) private readonly aanwezigLedenService: AanwezigLedenService,
               @Inject(forwardRef(() => AanwezigVliegtuigenService)) private readonly aanwezigVliegtuigenService: AanwezigVliegtuigenService,
               private readonly ledenService: LedenService,
               private readonly permissieService: PermissieService,
               private readonly roosterService: RoosterService,
               private readonly vliegtuigenService: VliegtuigenService)
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
   async GetObjects(params?: GetObjectsOperStartlijstRequest, beperking?: StartlijstBeperking): Promise<IHeliosGetObjectsResponse<GetObjectsOperStartlijstResponse>>
   {
      this.logger.verbose(`StartlijstService.GetObjects(${safeStringify({params, beperking})})`);
      if (params === undefined)
         params = MaakGetObjectsRequest(GetObjectsOperStartlijstRequest, {VERWIJDERD: false});
      const dtSpanne = params.VanTot(params.DATUM, params.BEGIN_DATUM, params.EIND_DATUM);

      // DDWV is geen kolom op oper_startlijst maar afgeleid van oper_daginfo/oper_rooster op DATUM, zie startlijst_view
      let ddwvDatums: Date[] | undefined;
      if (params.DDWV)
         ddwvDatums = await this.DDWVDatums();

      // SELECTIE zoekt net als PHP ook in REG_CALL ("REGISTRATIE (CALLSIGN)"), dat geen kolom is - daarom eerst de
      // vliegtuigen bepalen waarvan de REG_CALL de zoektekst bevat (hoofdletterongevoelig, zoals MySQL LIKE)
      let selectieVliegtuigIds: number[] = [];
      if (params.SELECTIE)
      {
         const zoek = params.SELECTIE.trim().toLowerCase();
         const vliegtuigen = await this.dbService.refVliegtuig.findMany({select: {ID: true, REGISTRATIE: true, CALLSIGN: true}});
         selectieVliegtuigIds = vliegtuigen
            .filter(vliegtuig => RegCall(vliegtuig.REGISTRATIE, vliegtuig.CALLSIGN).toLowerCase().includes(zoek))
            .map(vliegtuig => vliegtuig.ID);
      }

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
                        { Vlieger: { NAAM: { contains: params.SELECTIE.trim() } } },
                        { Inzittende: { NAAM: { contains: params.SELECTIE.trim() } } },
                        { VLIEGERNAAM: { contains: params.SELECTIE.trim() } },
                        { INZITTENDENAAM: { contains: params.SELECTIE.trim() } },
                        { VLIEGTUIG_ID: { in: selectieVliegtuigIds } },
                     ]
                  } : {},
                  this.BeperkingWhere(beperking),
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

      const dataset = await this.MaakGetObjectsResponseDataset(objs);
      const result = this.buildGetObjectsResponse(dataset, count, params.HASH);
      this.logger.verbose(`StartlijstService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   // datums waarop een DDWV bedrijf gepland staat, via oper_daginfo of oper_rooster (zie startlijst_view)
   async DDWVDatums(): Promise<Date[]>
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

   // logboek van een lid (of vliegtuig): alle starts van dat lid (of vliegtuig) in een bepaalde periode, inclusief de naam van de vlieger en inzittende (lid-naam of vrije-tekst naam)
   // Met alleenDDWV worden enkel de vluchten op DDWV dagen opgehaald (beheerder DDWV die het logboek van een ander lid opvraagt)
   async GetLogboek(params: GetLogboekRequest, lidId: number, alleenDDWV = false): Promise<IHeliosGetObjectsResponse<GetLogboekResponse>>
   {
      this.logger.verbose(`StartlijstService.GetLogboek(${safeStringify({params, lidId, alleenDDWV})})`);

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
         DDWV: alleenDDWV || undefined,
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

   // logboek-totalen van een lid voor een heel jaar (standaard het huidige jaar): aantal starts per startmethode,
   // starts en vliegtijd per vliegtuig en de jaartotalen, zie GetLogboekTotalen() in class.Startlijst.inc.php.
   // Voor een instructeur tellen ook de instructievluchten mee waarop hij/zij inzittende was.
   // Met alleenDDWV tellen enkel de vluchten op DDWV dagen mee (beheerder DDWV die de totalen van een ander lid opvraagt).
   async GetLogboekTotalen(params: GetLogboekTotalenRequest, lidId: number, alleenDDWV = false): Promise<GetLogboekTotalenResponse>
   {
      this.logger.verbose(`StartlijstService.GetLogboekTotalen(${safeStringify({params, lidId, alleenDDWV})})`);

      const lid = await this.ledenService.GetObject(lidId); // NOT_FOUND als het lid niet bestaat
      const isInstructeur = this.permissieService.isInstructeur(lid);

      const jaar = params.JAAR ?? new Date().getFullYear();
      const or: Prisma.OperStartlijstWhereInput[] = [{VLIEGER_ID: lidId}];
      if (isInstructeur)
         or.push({INZITTENDE_ID: lidId, INSTRUCTIEVLUCHT: true});

      const vluchten = await this.dbService.operStartlijst.findMany({
         where: {
            VERWIJDERD: false,
            STARTTIJD: {not: null},
            LANDINGSTIJD: {not: null},
            AND: [
               {DATUM: {gte: new Date(Date.UTC(jaar, 0, 1)), lte: new Date(Date.UTC(jaar, 11, 31))}},
               alleenDDWV ? {DATUM: {in: await this.DDWVDatums()}} : {},
            ],
            OR: or,
         },
         select: {
            DATUM: true, STARTTIJD: true, LANDINGSTIJD: true, INZITTENDE_ID: true,
            Vliegtuig: {select: {REGISTRATIE: true, CALLSIGN: true, CLUBKIST: true, VOLGORDE: true}},
            Startmethode: {select: {OMSCHRIJVING: true}},
         },
      });

      // zelfde volgorde als PHP: clubkisten eerst, dan op VOLGORDE (NULL eerst, zoals MySQL) en REG_CALL. De
      // volgorde van de vliegtuigen en startmethodes in het resultaat volgt uit de eerste vlucht waarin ze voorkomen
      const regCall = (vlucht: typeof vluchten[number]) => RegCall(vlucht.Vliegtuig.REGISTRATIE, vlucht.Vliegtuig.CALLSIGN);
      vluchten.sort((a, b) =>
         Number(b.Vliegtuig.CLUBKIST) - Number(a.Vliegtuig.CLUBKIST)
         || (a.Vliegtuig.VOLGORDE ?? -1) - (b.Vliegtuig.VOLGORDE ?? -1)
         || regCall(a).localeCompare(regCall(b)));

      const perVliegtuig = new Map<string, {starts: number, minuten: number}>();
      const perMethode = new Map<string | null, number>();
      let instructieStarts = 0, instructieMinuten = 0, totaalMinuten = 0;
      for (const vlucht of vluchten)
      {
         const minuten = this.BerekenDuurMinutes(vlucht.DATUM, vlucht.STARTTIJD, vlucht.LANDINGSTIJD) ?? 0;
         totaalMinuten += minuten;

         const vliegtuig = perVliegtuig.get(regCall(vlucht)) ?? {starts: 0, minuten: 0};
         vliegtuig.starts++;
         vliegtuig.minuten += minuten;
         perVliegtuig.set(regCall(vlucht), vliegtuig);

         const methode = vlucht.Startmethode?.OMSCHRIJVING ?? null;
         perMethode.set(methode, (perMethode.get(methode) ?? 0) + 1);

         if (isInstructeur && vlucht.INZITTENDE_ID === lidId)
         {
            instructieStarts++;
            instructieMinuten += minuten;
         }
      }

      const starts: GetLogboekTotalenStartsResponse[] = [...perMethode.entries()]
         .map(([METHODE, AANTAL]) => ({METHODE, AANTAL}));
      const vliegtuigen: GetLogboekTotalenVliegtuigResponse[] = [...perVliegtuig.entries()]
         .map(([REG_CALL, stats]) => ({REG_CALL, STARTS: stats.starts, VLIEGTIJD: this.FormatteerUren(stats.minuten)}));
      const totalen = {
         starts,
         vliegtuigen,
         jaar: {
            STARTS: vluchten.length,
            INSTRUCTIE_STARTS: instructieStarts,
            INSTRUCTIE_UREN: this.FormatteerUren(instructieMinuten),
            VLIEGTIJD: this.FormatteerUren(totaalMinuten),
         },
      };

      const hash = crc32(JSON.stringify(totalen));
      if (params.HASH !== undefined && params.HASH === hash)
         throw new HttpException("Data is ongewijzigd", HttpStatus.NOT_MODIFIED);

      const result: GetLogboekTotalenResponse = {totaal: vluchten.length, hash, ...totalen};
      this.logger.verbose(`StartlijstService.GetLogboekTotalen() => ${safeStringify(result)}`);
      return result;
   }

   // vliegdagen met per dag het aantal starts en de totale vliegtijd, zie GetVliegDagen() in class.Startlijst.inc.php.
   // Zonder BEGIN_DATUM en EIND_DATUM wordt het huidige jaar opgehaald; met maar een van beide is de andere kant open.
   async GetVliegDagen(params: GetVliegDagenRequest, beperking?: StartlijstBeperking): Promise<IHeliosGetObjectsResponse<GetVliegDagenResponse>>
   {
      this.logger.verbose(`StartlijstService.GetVliegDagen(${safeStringify({params, beperking})})`);

      let beginDatum = params.BEGIN_DATUM ? DatumZonderTijd(params.BEGIN_DATUM) : undefined;
      let eindDatum = params.EIND_DATUM ? DatumZonderTijd(params.EIND_DATUM) : undefined;
      if (beginDatum === undefined && eindDatum === undefined)
      {
         const jaar = new Date().getFullYear();
         beginDatum = new Date(Date.UTC(jaar, 0, 1));
         eindDatum = new Date(Date.UTC(jaar, 11, 31));
      }

      const vluchten = await this.dbService.operStartlijst.findMany({
         where: {
            VERWIJDERD: false,
            DATUM: {gte: beginDatum, lte: eindDatum},
            AND: [
               params.LID_ID !== undefined ? {OR: [{VLIEGER_ID: params.LID_ID}, {INZITTENDE_ID: params.LID_ID}]} : {},
               this.BeperkingWhere(beperking),
            ],
         },
         select: {DATUM: true, STARTTIJD: true, LANDINGSTIJD: true},
      });

      // COUNT(*) telt elke start op die dag, ook zonder STARTTIJD; de vliegtijd is de som van de DUUR van de starts
      // waarvoor die te berekenen is (SUM() negeert NULL), of null als dat voor geen enkele start zo is
      const perDag = new Map<number, {starts: number, minuten: number | null}>();
      for (const vlucht of vluchten)
      {
         const dag = perDag.get(vlucht.DATUM.getTime()) ?? {starts: 0, minuten: null};
         dag.starts++;
         const minuten = this.BerekenDuurMinutes(vlucht.DATUM, vlucht.STARTTIJD, vlucht.LANDINGSTIJD);
         if (minuten !== null)
            dag.minuten = (dag.minuten ?? 0) + minuten;
         perDag.set(vlucht.DATUM.getTime(), dag);
      }

      let dagen = [...perDag.entries()].map(([dag, stats]) => ({DATUM: dag, STARTS: stats.starts, MINUTEN: stats.minuten}));
      dagen.sort(this.VliegDagenSortering(params.SORT ?? "DATUM"));

      // totaal = aantal vliegdagen, vóór MAX (PHP kent hier geen START)
      const totaal = dagen.length;
      if (params.MAX !== undefined && params.MAX > 0)
         dagen = dagen.slice(0, params.MAX);

      const dataset: GetVliegDagenResponse[] = dagen.map(dag => ({
         DATUM: toDateOnly(new Date(dag.DATUM)) as unknown as Date,
         STARTS: dag.STARTS,
         VLIEGTIJD: dag.MINUTEN === null ? null : MinutenNaarTijd(dag.MINUTEN),
      }));
      const result = this.buildGetObjectsResponse(dataset, totaal, params.HASH);
      this.logger.verbose(`StartlijstService.GetVliegDagen() => ${safeStringify(result)}`);
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
         totaal + (this.BerekenDuurMinutes(datum, vlucht.STARTTIJD, vlucht.LANDINGSTIJD, true) ?? 0), 0);

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
   async GetRecency(vliegerId: number, datum?: Date, inclusiefInstructie = true, alleenClubKisten = false): Promise<RecencyResponse>
   {
      this.logger.verbose(`StartlijstService.GetRecency(${safeStringify({vliegerId, datum, inclusiefInstructie, alleenClubKisten})})`);

      const lid = await this.ledenService.GetObject(vliegerId); // NOT_FOUND als het lid niet bestaat
      const isInstructeur = this.permissieService.isInstructeur(lid);

      // peildatum zonder tijd-component (UTC-middernacht, net als DATUM op oper_startlijst)
      const peilDatumZonderTijd = DatumZonderTijd(datum ?? new Date());

      // periode: vanaf 1 januari, 2 jaar voor het jaar van de peildatum, t/m de peildatum
      const periodeStart = new Date(Date.UTC(peilDatumZonderTijd.getUTCFullYear() - 2, 0, 1));

      const or: Prisma.OperStartlijstWhereInput[] = [{VLIEGER_ID: vliegerId}];
      if (isInstructeur && inclusiefInstructie)
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
      if (isInstructeur)
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

   // na het opslaan van een start het vliegtuig aanmelden voor die vliegdag, en zodra de start een STARTTIJD heeft
   // ook de vlieger en inzittende, zie AddObject()/UpdateObject() in class.Startlijst.inc.php. Net als in PHP mag
   // een mislukte aanmelding het opslaan van de start niet laten mislukken: de fout wordt alleen gelogd.
   // volleToegang (bepaald in de controller): mag de gebruiker op deze datum ook andere leden aanmelden
   async AanmeldenNaOpslaan(start: OperStartlijst, actorId: number, volleToegang: boolean): Promise<void>
   {
      this.logger.verbose(`StartlijstService.AanmeldenNaOpslaan(${safeStringify({start, actorId, volleToegang})})`);
      try
      {
         // zie AanmeldenVliegtuig() in class.Startlijst.inc.php
         await this.aanwezigVliegtuigenService.Aanmelden({
            DATUM: start.DATUM,
            VLIEGTUIG_ID: start.VLIEGTUIG_ID,
            VELD_ID: start.VELD_ID,
         }, actorId);

         if (start.STARTTIJD !== null)
            await this.AanmeldenVliegerEnInzittende(start, actorId, volleToegang);
      }
      catch (e)
      {
         this.logger.warn(`StartlijstService.AanmeldenNaOpslaan(ID=${start.ID}) mislukt: ${e instanceof Error ? e.message : e}`);
      }
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
            STARTTIJD: toTimeHHmm(startlijst.STARTTIJD) as unknown as Date,
            LANDINGSTIJD: toTimeHHmm(startlijst.LANDINGSTIJD) as unknown as Date,
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

   // vergelijkingsfunctie voor de SORT parameter van GetVliegDagen(), bijvoorbeeld "STARTS DESC, DATUM". Enkel
   // de kolommen van de GetVliegDagen() dataset zijn toegestaan
   private VliegDagenSortering(sort: string): (a: VliegDag, b: VliegDag) => number
   {
      const velden = sort.split(',').map(deel =>
      {
         const [veld, richting] = deel.trim().split(/\s+/);
         const kolom = veld?.toUpperCase();
         if (kolom !== 'DATUM' && kolom !== 'STARTS' && kolom !== 'VLIEGTIJD')
            throw new HttpException("SORT is onjuist", HttpStatus.BAD_REQUEST);
         if (richting !== undefined && !['ASC', 'DESC'].includes(richting.toUpperCase()))
            throw new HttpException("SORT is onjuist", HttpStatus.BAD_REQUEST);
         return {kolom, factor: richting?.toUpperCase() === 'DESC' ? -1 : 1};
      });

      return (a, b) =>
      {
         for (const {kolom, factor} of velden)
         {
            let verschil: number;
            if (kolom === 'DATUM')
               verschil = a.DATUM - b.DATUM;
            else if (kolom === 'STARTS')
               verschil = a.STARTS - b.STARTS;
            else   // VLIEGTIJD, op minuten (niet op de "HH:mm" string), NULL eerst zoals MySQL
               verschil = (a.MINUTEN ?? -1) - (b.MINUTEN ?? -1);
            if (verschil !== 0)
               return verschil * factor;
         }
         return 0;
      };
   }

   // aanmelden van vlieger en inzittende voor de vliegdag, zie Aanmeldingen() in class.Startlijst.inc.php. Een
   // ander lid dan jezelf wordt alleen aangemeld met volledige toegang op die datum
   private async AanmeldenVliegerEnInzittende(start: OperStartlijst, actorId: number, volleToegang: boolean): Promise<void>
   {
      if (start.VELD_ID === Vliegveld.Elders)
         return;

      if (start.VLIEGER_ID !== null && (volleToegang || start.VLIEGER_ID === actorId))
      {
         const vlieger = await this.ledenService.GetObject(start.VLIEGER_ID);
         if (this.moetAangemeldWorden(vlieger))
         {
            // clubkist: het type als voorkeur opgeven, privékist: het vliegtuig zelf als overland vliegtuig
            const vliegtuig = await this.vliegtuigenService.GetObject(start.VLIEGTUIG_ID);
            await this.aanwezigLedenService.Aanmelden({
               DATUM: start.DATUM,
               LID_ID: start.VLIEGER_ID,
               VELD_ID: start.VELD_ID,
               ...(vliegtuig.CLUBKIST
                  ? {VOORKEUR_VLIEGTUIG_TYPE: vliegtuig.TYPE_ID?.toString()}
                  : {OVERLAND_VLIEGTUIG_ID: vliegtuig.ID}),
            }, actorId);
         }
      }

      // op een DDWV-only dag wordt de inzittende niet aangemeld (anders worden er strippen afgeschreven). PHP gooit
      // hier een fout als er geen rooster voor de datum bestaat, waardoor de inzittende dan niet aangemeld wordt -
      // hier geldt een dag zonder rooster als een gewone clubdag
      const rooster = await this.roosterService.GetObjectByDatum(start.DATUM);
      if (rooster?.DDWV && !rooster.CLUB_BEDRIJF)
         return;

      if (start.INZITTENDE_ID !== null && (volleToegang || start.INZITTENDE_ID === actorId))
      {
         const inzittende = await this.ledenService.GetObject(start.INZITTENDE_ID);
         if (this.moetAangemeldWorden(inzittende))
         {
            await this.aanwezigLedenService.Aanmelden({
               DATUM: start.DATUM,
               LID_ID: start.INZITTENDE_ID,
               VELD_ID: start.VELD_ID,
            }, actorId);
         }
      }
   }

   // alleen deze lidtypes worden automatisch aangemeld vanuit de startlijst. PHP (Aanmeldingen() in
   // class.Startlijst.inc.php) sluit Student, Zusterclub, NieuwLid, Oprotkabel en Penningmeester uit - dit is de
   // omgekeerde lijst, zodat een nieuw lidtype niet ongemerkt automatisch aangemeld wordt
   private moetAangemeldWorden(lid: RefLid): boolean
   {
      const aanmelden: number[] = [
         LidType.Erelid,
         LidType.Lid,
         LidType.Jeugdlid,
         LidType.PrivateOwner,
         LidType.Veteraan,
         LidType.Donateur,
         LidType.Rittenkaart,
         LidType.Cursist,
         LidType.DDWV,
      ];
      return aanmelden.includes(lid.LIDTYPE_ID);
   }

   // vertaalt de beperking (zie StartlijstBeperking) naar een Prisma where conditie
   private BeperkingWhere(beperking?: StartlijstBeperking): Prisma.OperStartlijstWhereInput
   {
      if (!beperking)
         return {};

      const condities: Prisma.OperStartlijstWhereInput[] = [];
      if (beperking.LID_ID !== undefined)
      {
         const of: Prisma.OperStartlijstWhereInput[] = [{VLIEGER_ID: beperking.LID_ID}, {INZITTENDE_ID: beperking.LID_ID}];
         if (beperking.DATUMS?.length)
            of.push({DATUM: {in: beperking.DATUMS}});
         condities.push({OR: of});
      }
      if (beperking.DATUM !== undefined)
         condities.push({DATUM: beperking.DATUM});
      return {AND: condities};
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

   // zie DUUR berekening in de startlijst_view: verstreken tijd tot nu (als het vandaag is en nog niet geland),
   // of het verschil tussen start- en landingstijd, of null als er nog geen landingstijd is op een andere dag.
   // Met zonsondergangSchatting wordt voor die laatste situatie geschat tot de zonsondergang op Terlet (alleen
   // voor LidVliegtijd(), dat is geen onderdeel van de PHP view).
   private BerekenDuurMinutes(datum: Date, starttijd: Date | null, landingstijd: Date | null, zonsondergangSchatting = false): number | null
   {
      this.logger.verbose(`StartlijstService.BerekenDuurMinutes(${safeStringify({datum, starttijd, landingstijd, zonsondergangSchatting})})`);
      if (!starttijd)
      {
         const result = null;
         this.logger.verbose(`StartlijstService.BerekenDuurMinutes() => ${safeStringify(result)}`);
         return result;
      }

      const vandaag = new Date();
      const isVandaag = datum.toDateString() === vandaag.toDateString();

      // STARTTIJD/LANDINGSTIJD zijn @db.Time kolommen: de UTC-velden bevatten de kloktijd. "Nu" en de zonsondergang
      // zijn echte tijdstippen, daarvan is de lokale tijd van de server de kloktijd (zoals curtime() in de view)
      let eindMinuten: number;
      if (landingstijd)
         eindMinuten = this.MinutenSindsMiddernacht(landingstijd);
      else if (isVandaag)
         eindMinuten = vandaag.getHours() * 60 + vandaag.getMinutes();
      else if (zonsondergangSchatting)
      {
         const zonsondergang = getSunset(TERLET_LATITUDE, TERLET_LONGITUDE, datum);
         eindMinuten = zonsondergang.getHours() * 60 + zonsondergang.getMinutes();
      }
      else
      {
         const result = null;    // geen landingstijd op een andere dag: DUUR is leeg in de view
         this.logger.verbose(`StartlijstService.BerekenDuurMinutes() => ${safeStringify(result)}`);
         return result;
      }

      const result = Math.max(0, Math.round((eindMinuten - this.MinutenSindsMiddernacht(starttijd) + 1440) % 1440));
      this.logger.verbose(`StartlijstService.BerekenDuurMinutes() => ${safeStringify(result)}`);
      return result;
   }

   // formatteert de vliegduur (zie BerekenDuurMinutes) als "HH:mm" string voor de startlijst_view. Net als de view:
   // null voor een start van vandaag zonder STARTTIJD (timediff met NULL), leeg als de duur op een andere dag niet
   // te berekenen is
   private BerekenDuurString(datum: Date, starttijd: Date | null, landingstijd: Date | null): string | null
   {
      this.logger.verbose(`StartlijstService.BerekenDuurString(${safeStringify({datum, starttijd, landingstijd})})`);
      const isVandaag = datum.toDateString() === new Date().toDateString();
      const minuten = this.BerekenDuurMinutes(datum, starttijd, landingstijd);
      const result = minuten !== null
         ? `${String(Math.floor(minuten / 60)).padStart(2, '0')}:${String(minuten % 60).padStart(2, '0')}`
         : (isVandaag ? null : '');
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
         const inzittende = await this.ledenService.GetObject(inzittendeId).catch(() => undefined);
         if (!inzittende || !this.permissieService.isInstructeur(inzittende))
            throw new HttpException("Instructie vlucht kan alleen door een instructeur worden gedaan", HttpStatus.CONFLICT);
      }

      const result = instructievlucht;
      this.logger.verbose(`StartlijstService.ValideerInstructieVlucht() => ${safeStringify(result)}`);
      return result;
   }
}