import {forwardRef, HttpException, HttpStatus, Inject, Injectable, Logger} from '@nestjs/common';
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
import {VliegStatus} from "../../core/enums/VliegStatus";
import {safeStringify} from "../../core/helpers/LogHelper";
import {DatumZonderTijd, MinutenNaarTijd, parseDateOnly, toDateOnly, toTimeOnly} from "../../core/helpers/TimeDate";
import {RegCall} from "../../core/helpers/RegCall";
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";
import {AanmeldenRequest} from "./AanmeldenRequest";
import {AfmeldenRequest} from "./AfmeldenRequest";
import {AanwezigLedenSamenvattingResponse} from "./AanwezigLedenSamenvattingResponse";
import {StartlijstService} from "../startlijst/startlijst.service";
import {TypesService} from "../types/types.service";
import {GetObjectsRefTypesRequest} from "../types/GetObjectsRefTypesRequest";
import {VliegtuigenService} from "../vliegtuigen/vliegtuigen.service";
import {GetObjectsRefVliegtuigenRequest} from "../vliegtuigen/GetObjectsRefVliegtuigenRequest";

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
               private readonly eventEmitter: EventEmitter2,
               @Inject(forwardRef(() => StartlijstService)) private readonly startlijstService: StartlijstService,
               private readonly typesService: TypesService,
               private readonly vliegtuigenService: VliegtuigenService)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number): Promise<OperAanwezigLid>
   {
      this.logger.verbose(`AanwezigLedenService.GetObject(${safeStringify({id})})`);
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
         params = MaakGetObjectsRequest(GetObjectsOperAanwezigLedenRequest, {VERWIJDERD: false});
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

      const dataset = await this.MaakGetObjectsResponseDataset(objs);
      const result = this.buildGetObjectsResponse(dataset, count, params.HASH);
      this.logger.verbose(`AanwezigLedenService.GetObjects() => ${safeStringify(result)}`);
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

   async UpdateObject(id: number, data: UpdateOperAanwezigLidDto | Prisma.OperAanwezigLidUncheckedUpdateInput, actorId: number): Promise<OperAanwezigLid>
   {
      this.logger.verbose(`AanwezigLedenService.UpdateObject(${safeStringify({id, data})})`);
      const update = data as Prisma.OperAanwezigLidUncheckedUpdateInput;

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

   // Aanmelden van een lid als aanwezig. Maakt een nieuw record aan, of past de bestaande aanmelding van
   // dat lid op die dag aan (bv. tweede aanmelding met een ander gewenst vliegtuigtype).
   async Aanmelden(data: AanmeldenRequest, actorId: number): Promise<OperAanwezigLid>
   {
      this.logger.verbose(`AanwezigLedenService.Aanmelden(${safeStringify({data})})`);
      if (data.LID_ID === undefined || data.LID_ID === null)
         throw new HttpException("LID_ID moet ingevuld zijn", HttpStatus.NOT_ACCEPTABLE);

      const tijdstip = data.TIJDSTIP ? new Date(data.TIJDSTIP) : new Date();
      const datum = data.DATUM ? parseDateOnly(data.DATUM) as Date : DatumZonderTijd(tijdstip);
      const isVandaag = datum.getTime() === DatumZonderTijd(new Date()).getTime();

      const bestaand = await this.BestaandeAanmelding(data.LID_ID, datum);

      if (bestaand)
      {
         const update: Prisma.OperAanwezigLidUncheckedUpdateInput = {};
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

   // Afmelden van een aangemeld lid.
   async Afmelden(data: AfmeldenRequest, actorId: number): Promise<OperAanwezigLid>
   {
      this.logger.verbose(`AanwezigLedenService.Afmelden(${safeStringify({data})})`);
      if (data.LID_ID === undefined || data.LID_ID === null)
         throw new HttpException("LID_ID moet ingevuld zijn", HttpStatus.NOT_ACCEPTABLE);

      const nu = new Date();

      const bestaand = (data.ID !== undefined && data.ID !== null)
         ? await this.GetObject(data.ID).catch(() => null)
         : await this.BestaandeAanmelding(data.LID_ID, DatumZonderTijd(nu));

      if (!bestaand)
         throw new HttpException("Kan een lid alleen afmelden als het eerst aangemeld is", HttpStatus.CONFLICT);

      const update: Prisma.OperAanwezigLidUncheckedUpdateInput = {
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

      const req = MaakGetObjectsRequest(GetObjectsRefVliegtuigenRequest, { CLUBKIST: true})
      const clubVliegtuigenResultaat = await this.vliegtuigenService.GetObjects(req);
      const clubVliegtuigen = clubVliegtuigenResultaat.dataset;
      const clubkistIds = new Set(clubVliegtuigen.map(v => v.ID));
      const clubTypeIds = [...new Set(clubVliegtuigen.map(v => v.TYPE_ID).filter((id): id is number => id !== null))];
      const clubTypes = clubTypeIds.length
         ? await this.dbService.refType.findMany({where: {ID: {in: clubTypeIds}}, orderBy: {SORTEER_VOLGORDE: "asc"}})
         : [];
      const typesAangevraagd = clubTypes.map(type => ({id: type.ID, type: type.OMSCHRIJVING, aantal: 0}));

      const aanmeldingen = await this.GetObjects(MaakGetObjectsRequest(GetObjectsOperAanwezigLedenRequest, {DATUM: datum}));

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

         if (aanmelding.STATUSTYPE_ID === VliegStatus.DBO) dbo++;
         else if (aanmelding.STATUSTYPE_ID === VliegStatus.Solist) solisten++;
         else if (aanmelding.STATUSTYPE_ID === VliegStatus.Brevethouder) brevethouders++;

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

   // maak de dataset voor de GetObjects response, inclusief de relaties met andere tabellen
   private async MaakGetObjectsResponseDataset(objs: AanwezigLidMetRelaties[]): Promise<GetObjectsOperAanwezigLedenResponse[]>
   {
      this.logger.verbose(`AanwezigLedenService.MaakGetObjectsResponseDataset(${safeStringify({objs})})`);
      if (objs.length === 0)
      {
         const result = [];
         this.logger.verbose(`AanwezigLedenService.MaakGetObjectsResponseDataset() => ${safeStringify(result)}`);
         return result;
      }

      const dbVliegtuigTypes = await this.typesService.GetObjects(MaakGetObjectsRequest(GetObjectsRefTypesRequest, {
         GROEP: TypesGroep.VliegtuigTypes,
      }));
      const vliegtuigTypes = dbVliegtuigTypes.dataset;

      const result = await Promise.all(objs.map(async obj =>
      {
         const {RefLid: lid, RefVliegtuig: vliegtuig, Veld: veld, ...aanwezigLid} = obj;

         const gewensteTypes = vliegtuigTypes.filter(type => aanwezigLid.VOORKEUR_VLIEGTUIG_TYPE?.includes(String(type.ID)));

         // VLIEGT / VLIEGTIJD / STARTS: rechtstreekse, lichtgewicht queries op Startlijst
         const [vliegtNu, vliegtijdMinuten, starts] = await Promise.all([
            this.startlijstService.LidVliegt(obj.LID_ID, obj.DATUM),
            this.startlijstService.LidVliegtijd(obj.LID_ID, obj.DATUM),
            this.startlijstService.LidStarts(obj.LID_ID, obj.DATUM),
         ]);

         return {
            ...aanwezigLid,
            DATUM: toDateOnly(aanwezigLid.DATUM) as unknown as Date,
            AANKOMST: toTimeOnly(aanwezigLid.AANKOMST) as unknown as Date,
            VERTREK: toTimeOnly(aanwezigLid.VERTREK) as unknown as Date,
            REG_CALL: vliegtuig ? RegCall(vliegtuig.REGISTRATIE, vliegtuig.CALLSIGN) : null,
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
            VLIEGTIJD: vliegtijdMinuten > 0 ? MinutenNaarTijd(vliegtijdMinuten) : null,
            STARTS: starts,
            VLIEGT: vliegtNu ? 1 : 0,
         } as GetObjectsOperAanwezigLedenResponse;
      }));
      this.logger.verbose(`AanwezigLedenService.MaakGetObjectsResponseDataset() => ${safeStringify(result)}`);
      return result;
   }

   // zoekt de actieve aanmelding van dit lid op deze datum, of null
   private async BestaandeAanmelding(lidId: number, datum: Date): Promise<OperAanwezigLid | null>
   {
      this.logger.verbose(`AanwezigLedenService.BestaandeAanmelding(${safeStringify({lidId, datum})})`);
      const result = await this.dbService.operAanwezigLid.findFirst({
         where: {LID_ID: lidId, DATUM: datum, VERWIJDERD: false}
      });
      this.logger.verbose(`AanwezigLedenService.BestaandeAanmelding() => ${safeStringify(result)}`);
      return result;
   }
}
