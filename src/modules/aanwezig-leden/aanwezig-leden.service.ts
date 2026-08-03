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

   async AddObject(data: CreateOperAanwezigLidDto): Promise<OperAanwezigLid>
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

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, insertData, obj);
      const result = obj;
      this.logger.verbose(`AanwezigLedenService.AddObject() => ${safeStringify(result)}`);
      return result;
   }

   async UpdateObject(id: number, data: UpdateOperAanwezigLidDto | Prisma.OperAanwezigLidUpdateInput): Promise<OperAanwezigLid>
   {
      this.logger.verbose(`AanwezigLedenService.UpdateObject(${safeStringify({id, data})})`);
      const db = await this.GetObject(id);
      const obj = await this.dbService.operAanwezigLid.update({
         where: {
            ID: id
         },
         data: data as Prisma.OperAanwezigLidUpdateInput
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id,  db, data, obj);
      const result = obj;
      this.logger.verbose(`AanwezigLedenService.UpdateObject() => ${safeStringify(result)}`);
      return result;
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
}
