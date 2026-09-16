import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, OperAanwezigLid, RefLid} from "@prisma/client";
import {GetObjectsOperAanwezigLedenRequest} from "./GetObjectsOperAanwezigLedenRequest";
import {GetObjectsOperAanwezigLedenResponse} from "./GetObjectsOperAanwezigLedenResponse";
import {CreateOperAanwezigLidDto} from "../../generated/nestjs-dto/create-operAanwezigLid.dto";
import {UpdateOperAanwezigLidDto} from "../../generated/nestjs-dto/update-operAanwezigLid.dto";
import {TypesGroep} from "../../core/enums/TypesGroep";
import {safeStringify} from "../../core/helpers/LogHelper";
import {parseDateOnly, toDateOnly, toTimeOnly} from "../../core/helpers/DateOnly";
import {AanmeldenRequest} from "./AanmeldenRequest";
import {AfmeldenRequest} from "./AfmeldenRequest";
import {AanwezigLedenSamenvattingResponse} from "./AanwezigLedenSamenvattingResponse";

// aanwezig lid record inclusief de relaties die de PHP aanwezig_leden_view samenvoegt
type AanwezigLidMetRelaties = Prisma.OperAanwezigLidGetPayload<{
   include: {
      RefLid: { include: { LidType: true, VliegStatus: true } },
      RefVliegtuig: true,
      Veld: true,
   }
}>;

@Injectable()
export class AanwezigLedenService extends IHeliosService
{
   private readonly logger = new Logger(AanwezigLedenService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number, relation: string = undefined): Promise<OperAanwezigLid>
   {
      this.logger.verbose(`AanwezigLedenService.GetObject(${safeStringify({id, relation})})`);
      // relatie wordt meegenomen voor consistentie met andere services, maar wordt niet gebruikt
      const db = await this.dbService.operAanwezigLid.findUnique({
         where: {
            ID: id
         },
      });

      if (!db)
         throw new HttpException(`AanwezigLid record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);
      const result = db;
      this.logger.verbose(`AanwezigLedenService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsOperAanwezigLedenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperAanwezigLedenResponse>>
   {
      this.logger.verbose(`AanwezigLedenService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
      {
         params = new GetObjectsOperAanwezigLedenRequest();
         params.VERWIJDERD = false;
      }
      const dtSpanne = params.VanTot(params.DATUM, params.BEGIN_DATUM, params.EIND_DATUM);
      const where: Prisma.OperAanwezigLidWhereInput =
          {
             AND:
                 [
                    {ID: params.ID},
                    {VERWIJDERD: params.VERWIJDERD ?? false},
                    {ID: {in: params.IDs}},
                    {LID_ID: params.IN ? {in: params.IN} : undefined},
                    {VERTREK: params.NIET_VERTROKKEN ? null : undefined},
                    {VELD_ID: params.VLIEGVELD},
                    {
                       RefLid: {
                          NAAM: params.SELECTIE ? {contains: params.SELECTIE} : undefined,
                          LIDTYPE_ID: params.TYPES ? {in: params.TYPES} : undefined,
                       }
                    },

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
         count = await this.dbService.operAanwezigLid.count({where: where});
      }
      const objs = await this.dbService.operAanwezigLid.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.OperAanwezigLidOrderByWithRelationInput>(params.SORT ?? "DATUM"),
         take: params.MAX,
         skip: params.START,
         include: {
            RefLid: {
               include: {
                  LidType: true,
                  VliegStatus: true,
               }
            },
            RefVliegtuig: true,
            Veld: true,
         }
      });

      const response = await this.NaarGetObjectsResponse(objs);

      const result = this.buildGetObjectsResponse(response, count, params.HASH);
      this.logger.verbose(`AanwezigLedenService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   // voegt de velden toe die de PHP aanwezig_leden_view samenvoegt: leden-, vliegtuig- en type-gegevens via joins,
   // en de vliegtijd/starts van vandaag via een gebatchte aggregatie op oper_startlijst (was per record een subquery)
   private async NaarGetObjectsResponse(objs: AanwezigLidMetRelaties[]): Promise<GetObjectsOperAanwezigLedenResponse[]>
   {
      this.logger.verbose(`AanwezigLedenService.NaarGetObjectsResponse(${safeStringify({objs})})`);
      if (objs.length === 0)
      {
         const result = [];
         this.logger.verbose(`AanwezigLedenService.NaarGetObjectsResponse() => ${safeStringify(result)}`);
         return result;
      }

      const vliegtuigTypes = await this.dbService.refType.findMany({where: {GROEP: TypesGroep.VliegtuigTypes}});

      const lidIds = [...new Set(objs.map(obj => obj.LID_ID))];
      const datums = [...new Map(objs.map(obj => [obj.DATUM.getTime(), obj.DATUM])).values()];
      const vluchtenVanVandaag = await this.dbService.operStartlijst.findMany({
         where: {
            VERWIJDERD: false,
            VLIEGER_ID: {in: lidIds},
            DATUM: {in: datums}
         }
      });

      const vluchtenPerLidEnDatum = new Map<string, typeof vluchtenVanVandaag>();
      for (const vlucht of vluchtenVanVandaag)
      {
         const key = `${vlucht.VLIEGER_ID}_${vlucht.DATUM.getTime()}`;
         if (!vluchtenPerLidEnDatum.has(key))
            vluchtenPerLidEnDatum.set(key, []);
         vluchtenPerLidEnDatum.get(key).push(vlucht);
      }

      const result = objs.map(obj =>
      {
         const {RefLid: lid, RefVliegtuig: vliegtuig, Veld: veld, ...aanwezigLid} = obj;

         const vluchten = vluchtenPerLidEnDatum.get(`${obj.LID_ID}_${obj.DATUM.getTime()}`) ?? [];
         const vluchtenMetStart = vluchten.filter(vlucht => vlucht.STARTTIJD !== null);
         const totaalSeconden = vluchtenMetStart.reduce((totaal, vlucht) =>
         {
            const eind = vlucht.LANDINGSTIJD ?? new Date();
            return totaal + Math.max(0, (eind.getTime() - vlucht.STARTTIJD.getTime()) / 1000);
         }, 0);

         const gewensteTypes = vliegtuigTypes.filter(type => aanwezigLid.VOORKEUR_VLIEGTUIG_TYPE?.includes(String(type.ID)));

         return {
            ...aanwezigLid,
            DATUM: toDateOnly(aanwezigLid.DATUM) as unknown as Date,
            AANKOMST: toTimeOnly(aanwezigLid.AANKOMST) as unknown as Date,
            VERTREK: toTimeOnly(aanwezigLid.VERTREK) as unknown as Date,
            REG_CALL: vliegtuig ? `${vliegtuig.REGISTRATIE ?? ''} (${vliegtuig.CALLSIGN ?? ''})` : null,
            NAAM: lid.NAAM,
            VOORNAAM: lid.VOORNAAM,
            TUSSENVOEGSEL: lid.TUSSENVOEGSEL,
            ACHTERNAAM: lid.ACHTERNAAM,
            ADRES: lid.ADRES,
            POSTCODE: lid.POSTCODE,
            WOONPLAATS: lid.WOONPLAATS,
            LIDNR: lid.LIDNR,
            LIDTYPE_ID: lid.LIDTYPE_ID,
            MOBIEL: lid.MOBIEL,
            EMAIL: lid.EMAIL,
            NOODNUMMER: lid.NOODNUMMER,
            TELEFOON: lid.TELEFOON,
            INSTRUCTEUR: lid.INSTRUCTEUR,
            STARTLEIDER: lid.STARTLEIDER,
            LIERIST: lid.LIERIST,
            CIMT: lid.CIMT,
            DDWV_CREW: lid.DDWV_CREW,
            DDWV_BEHEERDER: lid.DDWV_BEHEERDER,
            BEHEERDER: lid.BEHEERDER,
            STARTTOREN: lid.STARTTOREN,
            ROOSTER: lid.ROOSTER,
            CLUBBLAD_POST: lid.CLUBBLAD_POST,
            MEDICAL: lid.MEDICAL,
            GEBOORTE_DATUM: lid.GEBOORTE_DATUM,
            ZUSTERCLUB_ID: lid.ZUSTERCLUB_ID,
            INLOGNAAM: lid.INLOGNAAM,
            SECRET: lid.SECRET,
            AVATAR: lid.AVATAR,
            STARTVERBOD: lid.STARTVERBOD,
            PRIVACY: lid.PRIVACY,
            STATUSTYPE_ID: lid.STATUSTYPE_ID,
            VELD: veld?.OMSCHRIJVING ?? null,
            ZELFSTART_ABONNEMENT: lid.ZELFSTART_ABONNEMENT,
            LIDTYPE: lid.LidType?.OMSCHRIJVING,
            STATUS: lid.VliegStatus?.CODE ?? null,
            STATUS_SORTEER_VOLGORDE: lid.VliegStatus?.SORTEER_VOLGORDE ?? null,
            VLIEGTUIGTYPE_CODE: gewensteTypes.length ? gewensteTypes.map(type => type.CODE).join(',') : null,
            VLIEGTUIGTYPE_OMS: gewensteTypes.length ? gewensteTypes.map(type => type.OMSCHRIJVING).join(',') : null,
            VLIEGTIJD: vluchtenMetStart.length ? this.SecondenNaarTijd(totaalSeconden) : null,
            STARTS: vluchten.length,
            VLIEGT: vluchten.some(vlucht => vlucht.STARTTIJD !== null && vlucht.LANDINGSTIJD === null) ? 1 : 0,
         } as GetObjectsOperAanwezigLedenResponse;
      });
      this.logger.verbose(`AanwezigLedenService.NaarGetObjectsResponse() => ${safeStringify(result)}`);
      return result;
   }

   // vliegcurrency-indicator (rood/geel/groen) per lid over de laatste 26 weken, gebaseerd op de gewogen
   // gemiddelde van vlieguren en starts, zie Startlijst.GetRecency() in de PHP implementatie
   async GetStatusBarometers(leden: {LID_ID: number, INSTRUCTEUR?: boolean}[]): Promise<Map<number, string>>
   {
      this.logger.verbose(`AanwezigLedenService.GetStatusBarometers(${safeStringify({leden})})`);
      const lidIds = [...new Set(leden.map(lid => lid.LID_ID))];
      const instructeurIds = [...new Set(leden.filter(lid => lid.INSTRUCTEUR).map(lid => lid.LID_ID))];

      const vandaag = new Date();
      const vandaagDatum = new Date(vandaag.getFullYear(), vandaag.getMonth(), vandaag.getDate());
      const windowStart = new Date(vandaagDatum);
      windowStart.setDate(windowStart.getDate() - 182); // laatste 26 weken

      const vluchten = await this.dbService.operStartlijst.findMany({
         where: {
            VERWIJDERD: false,
            STARTTIJD: {not: null},
            LANDINGSTIJD: {not: null},
            DATUM: {gte: windowStart, lte: vandaagDatum},
            OR: [
               {VLIEGER_ID: {in: lidIds}},
               {INZITTENDE_ID: {in: instructeurIds}, INSTRUCTIEVLUCHT: true},
            ]
         }
      });

      const lidIdSet = new Set(lidIds);
      const instructeurIdSet = new Set(instructeurIds);
      const perLid = new Map<number, {starts: number, minuten: number}>();
      const voegVluchtToe = (lidId: number, vlucht: typeof vluchten[number]) =>
      {
         const stats = perLid.get(lidId) ?? {starts: 0, minuten: 0};
         stats.starts++;
         stats.minuten += (vlucht.LANDINGSTIJD.getTime() - vlucht.STARTTIJD.getTime()) / 60000;
         perLid.set(lidId, stats);
      };

      for (const vlucht of vluchten)
      {
         if (vlucht.VLIEGER_ID !== null && lidIdSet.has(vlucht.VLIEGER_ID))
            voegVluchtToe(vlucht.VLIEGER_ID, vlucht);
         if (vlucht.INSTRUCTIEVLUCHT && vlucht.INZITTENDE_ID !== null && instructeurIdSet.has(vlucht.INZITTENDE_ID))
            voegVluchtToe(vlucht.INZITTENDE_ID, vlucht);
      }

      const barometers = new Map<number, string>();
      for (const lidId of lidIds)
      {
         const stats = perLid.get(lidId) ?? {starts: 0, minuten: 0};
         const gemiddelde = (stats.minuten / 60 + stats.starts * 25 / 35) / 2;
         barometers.set(lidId, gemiddelde < 10 ? 'rood' : gemiddelde < 20 ? 'geel' : 'groen');
      }
      const result = barometers;
      this.logger.verbose(`AanwezigLedenService.GetStatusBarometers() => ${safeStringify(result)}`);
      return result;
   }

   private SecondenNaarTijd(seconden: number): string
   {
      this.logger.verbose(`AanwezigLedenService.SecondenNaarTijd(${safeStringify({seconden})})`);
      const uren = Math.floor(seconden / 3600);
      const minuten = Math.floor((seconden % 3600) / 60);
      const result = `${String(uren).padStart(2, '0')}:${String(minuten).padStart(2, '0')}`;
      this.logger.verbose(`AanwezigLedenService.SecondenNaarTijd() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: CreateOperAanwezigLidDto, actorId: number): Promise<OperAanwezigLid>
   {
      this.logger.verbose(`AanwezigLedenService.AddObject(${safeStringify({data})})`);
      const {LID_ID, OVERLAND_VLIEGTUIG_ID, TRANSACTIE_ID, VELD_ID, ...rest} = data;
      const connect = (id?: number) => id != null ? {connect: {ID: id}} : undefined;
      const insertData: Prisma.OperAanwezigLidCreateInput = {
         ...rest,
         RefLid: {connect: {ID: LID_ID}},
         RefVliegtuig: connect(OVERLAND_VLIEGTUIG_ID),
         Transactie: connect(TRANSACTIE_ID),
         Veld: connect(VELD_ID),
      };

      const obj = await this.dbService.operAanwezigLid.create({
         data: insertData
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, insertData, obj, actorId);
      this.logger.verbose(`AanwezigLedenService.AddObject() => ${safeStringify(obj)}`);
      return obj;
   }

   async UpdateObject(id: number, data: UpdateOperAanwezigLidDto | Prisma.OperAanwezigLidUpdateInput, actorId: number): Promise<OperAanwezigLid>
   {
      this.logger.verbose(`AanwezigLedenService.UpdateObject(${safeStringify({id, data})})`);
      const update = data as Prisma.OperAanwezigLidUpdateInput;

      const db = await this.GetObject(id);
      const obj = await this.dbService.operAanwezigLid.update({
         where: {
            ID: id
         },
         data: update
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, data, obj, actorId);
      this.logger.verbose(`AanwezigLedenService.UpdateObject() => ${safeStringify(obj)}`);
      return obj;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`AanwezigLedenService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.operAanwezigLid.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db, actorId);
   }

   async IsAangemeld(currentUser: RefLid): Promise<boolean> {
      this.logger.verbose(`AanwezigLedenService.IsAangemeld(${safeStringify({currentUser})})`);
      const rec = await this.dbService.operAanwezigLid.findFirst({ where: { LID_ID: currentUser.ID, DATUM: new Date(), VERWIJDERD: false } });
      const result = !!rec;
      this.logger.verbose(`AanwezigLedenService.IsAangemeld() => ${safeStringify(result)}`);
      return result;
   }

   // zoekt de actieve aanmelding van dit lid op deze datum, of null
   private async AanmeldingLidDatum(lidId: number, datum: Date): Promise<OperAanwezigLid | null>
   {
      this.logger.verbose(`AanwezigLedenService.AanmeldingLidDatum(${safeStringify({lidId, datum})})`);
      const result = await this.dbService.operAanwezigLid.findFirst({
         where: {LID_ID: lidId, DATUM: datum, VERWIJDERD: false}
      });
      this.logger.verbose(`AanwezigLedenService.AanmeldingLidDatum() => ${safeStringify(result)}`);
      return result;
   }

   // Aanmelden van een lid als aanwezig. Maakt een nieuw record aan, of past de bestaande aanmelding van
   // dat lid op die dag aan (bv. tweede aanmelding met een ander gewenst vliegtuigtype).
   async Aanmelden(data: AanmeldenRequest, actorId: number): Promise<OperAanwezigLid>
   {
      this.logger.verbose(`AanwezigLedenService.Aanmelden(${safeStringify({data})})`);
      if (data.LID_ID === undefined || data.LID_ID === null)
         throw new HttpException("LID_ID moet ingevuld zijn", HttpStatus.NOT_ACCEPTABLE);

      const tijdstip = data.TIJDSTIP ? new Date(data.TIJDSTIP) : new Date();
      const datum = data.DATUM ? parseDateOnly(data.DATUM) as Date : this.DatumZonderTijd(tijdstip);
      const isVandaag = datum.getTime() === this.DatumZonderTijd(new Date()).getTime();

      const bestaand = await this.AanmeldingLidDatum(data.LID_ID, datum);

      if (bestaand)
      {
         const update: Prisma.OperAanwezigLidUpdateInput = {};
         let aanpassen = false;

         // Bouw een CSV-unie van de gewenste vliegtuigtypes op i.p.v. het bestaande type te overschrijven -
         // zo blijft een eerdere aanmelding met ASK21 behouden als er nu ook een LS4-aanmelding bijkomt.
         if (data.VOORKEUR_VLIEGTUIG_TYPE)
         {
            const bestaandeTypes = (bestaand.VOORKEUR_VLIEGTUIG_TYPE ?? "").split(",").filter(Boolean);
            if (!bestaandeTypes.includes(data.VOORKEUR_VLIEGTUIG_TYPE))
            {
               update.VOORKEUR_VLIEGTUIG_TYPE = bestaandeTypes.length
                  ? `${bestaand.VOORKEUR_VLIEGTUIG_TYPE},${data.VOORKEUR_VLIEGTUIG_TYPE}`
                  : data.VOORKEUR_VLIEGTUIG_TYPE;
               aanpassen = true;
            }
         }

         if (isVandaag && bestaand.AANKOMST === null)
         {
            update.AANKOMST = tijdstip;
            aanpassen = true;
         }

         if (bestaand.VERTREK !== null)
         {
            update.VERTREK = null;
            aanpassen = true;
         }

         const overigeVelden = ["POSITIE", "VOORAANMELDING", "OVERLAND_VLIEGTUIG_ID", "OPMERKINGEN"] as const;
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
            this.logger.verbose(`AanwezigLedenService.Aanmelden: niet aangepast, id=${bestaand.ID}`);
            return bestaand;
         }

         await this.UpdateObject(bestaand.ID, update, actorId);
         const result = await this.GetObject(bestaand.ID);
         this.logger.verbose(`AanwezigLedenService.Aanmelden() => ${safeStringify(result)}`);
         return result;
      }

      // Achteraan de lijst van aanwezigen toevoegen door de hoogste bestaande POSITIE die dag met 1 te verhogen
      let positie = data.POSITIE;
      if (positie === undefined)
      {
         const laatste = await this.dbService.operAanwezigLid.findFirst({
            where: {DATUM: datum, VERWIJDERD: false},
            orderBy: {POSITIE: "desc"},
         });
         positie = (laatste?.POSITIE ?? 0) + 1;
      }

      const insertData: CreateOperAanwezigLidDto = {
         DATUM: datum,
         LID_ID: data.LID_ID,
         POSITIE: positie,
         VOORAANMELDING: data.VOORAANMELDING,
         AANKOMST: (isVandaag && data.AANKOMST === undefined) ? tijdstip : (data.AANKOMST as Date ?? null),
         VERTREK: null, // zeker weten dat vertrek niet gezet wordt bij een nieuwe aanmelding
         OVERLAND_VLIEGTUIG_ID: data.OVERLAND_VLIEGTUIG_ID,
         VOORKEUR_VLIEGTUIG_TYPE: data.VOORKEUR_VLIEGTUIG_TYPE,
         VELD_ID: data.VELD_ID,
         OPMERKINGEN: data.OPMERKINGEN,
      };

      const aangemeld = await this.AddObject(insertData, actorId);
      const result = await this.GetObject(aangemeld.ID);
      this.logger.verbose(`AanwezigLedenService.Aanmelden() => ${safeStringify(result)}`);
      return result;
   }

   // Afmelden van een aangemeld lid. Zie AanwezigLeden.Afmelden() in de PHP implementatie - het strippen-
   // bijboeken voor DDWV staat daar al sinds "mei 2024" in commentaar en is dan ook niet overgenomen. PHP's
   // TIJDSTIP-parameter (afmelden op een ander moment dan nu) is hier niet overgenomen - de enige bestaande
   // client (Pegasus) gebruikt hem nooit, afmelden gebeurt altijd voor het huidige moment.
   async Afmelden(data: AfmeldenRequest, actorId: number): Promise<OperAanwezigLid>
   {
      this.logger.verbose(`AanwezigLedenService.Afmelden(${safeStringify({data})})`);
      if (data.LID_ID === undefined || data.LID_ID === null)
         throw new HttpException("LID_ID moet ingevuld zijn", HttpStatus.NOT_ACCEPTABLE);

      const nu = new Date();

      // net als in PHP: als een ID is meegegeven wordt uitsluitend daarop gezocht (LID_ID/datum spelen dan
      // geen rol meer bij het opzoeken)
      const bestaand = (data.ID !== undefined && data.ID !== null)
         ? await this.dbService.operAanwezigLid.findUnique({where: {ID: data.ID}})
         : await this.AanmeldingLidDatum(data.LID_ID, this.DatumZonderTijd(nu));

      if (!bestaand)
         throw new HttpException("Kan een lid alleen afmelden als het eerst aangemeld is", HttpStatus.CONFLICT);

      const update: Prisma.OperAanwezigLidUpdateInput = {
         VERTREK: data.VERTREK !== undefined ? data.VERTREK as Date : nu,
      };

      await this.UpdateObject(bestaand.ID, update, actorId);
      const result = await this.GetObject(bestaand.ID);
      this.logger.verbose(`AanwezigLedenService.Afmelden() => ${safeStringify(result)}`);
      return result;
   }

   // Samenvatting van de aanmeldingen van een vliegdag, zie AanwezigLeden.Samenvatting() in de PHP implementatie
   async Samenvatting(datum: Date): Promise<AanwezigLedenSamenvattingResponse>
   {
      this.logger.verbose(`AanwezigLedenService.Samenvatting(${safeStringify({datum})})`);

      // clubvliegtuigen en de types waarnaar ze verwijzen (equivalent van Types.GetClubVliegtuigenTypes())
      const clubVliegtuigen = await this.dbService.refVliegtuig.findMany({
         where: {VERWIJDERD: false, CLUBKIST: true},
         select: {ID: true, TYPE_ID: true},
      });
      const clubkistIds = new Set(clubVliegtuigen.map(v => v.ID));
      const clubTypeIds = [...new Set(clubVliegtuigen.map(v => v.TYPE_ID).filter((id): id is number => id !== null))];
      const clubTypes = clubTypeIds.length
         ? await this.dbService.refType.findMany({where: {ID: {in: clubTypeIds}}, orderBy: {SORTEER_VOLGORDE: "asc"}})
         : [];
      const typesAangevraagd = clubTypes.map(type => ({id: type.ID, type: type.OMSCHRIJVING, aantal: 0}));

      const aanmeldingen = await this.GetObjects(Object.assign(new GetObjectsOperAanwezigLedenRequest(), {DATUM: datum}));

      let dbo = 0, solisten = 0, brevethouders = 0, instructeurs = 0, lieristen = 0, startleiders = 0;
      const overland: {reg_call: string | null, naam: string}[] = [];

      for (const aanmelding of aanmeldingen.dataset)
      {
         const gewensteTypeIds = (aanmelding.VOORKEUR_VLIEGTUIG_TYPE ?? "").split(",").filter(Boolean).map(Number);
         for (const type of typesAangevraagd)
         {
            if (gewensteTypeIds.includes(type.id))
               type.aantal++;
         }

         if (aanmelding.OVERLAND_VLIEGTUIG_ID != null && clubkistIds.has(aanmelding.OVERLAND_VLIEGTUIG_ID))
            overland.push({reg_call: aanmelding.REG_CALL ?? null, naam: aanmelding.NAAM});

         // 1901 = DBO, 1902 = Solist, 1903 = Brevethouder (RefType records onder TypesGroep.Status)
         if (aanmelding.STATUSTYPE_ID === 1901) dbo++;
         else if (aanmelding.STATUSTYPE_ID === 1902) solisten++;
         else if (aanmelding.STATUSTYPE_ID === 1903) brevethouders++;

         if (aanmelding.LIERIST) lieristen++;
         if (aanmelding.INSTRUCTEUR) instructeurs++;
         if (aanmelding.STARTLEIDER) startleiders++;
      }

      const result: AanwezigLedenSamenvattingResponse = {
         aanmeldingen: aanmeldingen.totaal,
         dbo, solisten, brevethouders, lieristen, instructeurs, startleiders,
         types: typesAangevraagd,
         overland,
      };
      this.logger.verbose(`AanwezigLedenService.Samenvatting() => ${safeStringify(result)}`);
      return result;
   }

   // normaliseert een tijdstip naar de kalenderdatum ervan (UTC-middernacht), zodat deze vergeleken kan
   // worden met een @db.Date kolom zoals OperAanwezigLid.DATUM
   private DatumZonderTijd(tijdstip: Date): Date
   {
      return new Date(Date.UTC(tijdstip.getFullYear(), tijdstip.getMonth(), tijdstip.getDate()));
   }
}
