import {forwardRef, HttpException, HttpStatus, Inject, Injectable, Logger} from '@nestjs/common';
import {ConfigService} from "@nestjs/config";
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";

import {Prisma, RefLid} from '@prisma/client';
import {GetObjectsRefLedenRequest } from "./GetObjectsRefLedenRequest";
import {GetObjectsRefLedenResponse } from "./GetObjectsRefLedenResponse";
import {VerjaardagenResponse} from "./VerjaardagenResponse";
import {LidType} from "../../core/enums/LidType";
import {safeStringify} from "../../core/helpers/LogHelper";
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";
import {ProgressieService} from "../progressie/progressie.service";
import {MqttService} from "../../core/services/mqtt.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {promises as fs} from "fs";
import {join} from "path";

const PAX_COMPETENTIE_ID = 271; // "PaxBevoegdheid", configureerbaar maar in de praktijk altijd deze waarde

// herkende data-URI voorvoegsels voor UploadAvatar()
const AVATAR_PREFIXEN: {prefix: string, extensie: string}[] = [
   {prefix: 'data:image/jpeg;base64,', extensie: '.jpg'},
   {prefix: 'data:image/jpg;base64,', extensie: '.jpg'},
   {prefix: 'data:image/png;base64,', extensie: '.png'},
   {prefix: 'data:image/gif;base64,', extensie: '.gif'},
];

// lid record inclusief de relaties met LidType/VliegStatus/Zusterclub/Buddy/Buddy2,
// zodat we de omschrijving van het type/status en de naam van de zusterclub/buddy kunnen ophalen
type LidMetRelaties = Prisma.RefLidGetPayload<{
   include: {
      LidType: true,
      VliegStatus: true,
      Zusterclub: true,
      Buddy: true,
      Buddy2: true,
   }
}>;

@Injectable()
export class LedenService extends IHeliosService
{
   private readonly logger = new Logger(LedenService.name);

   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2,
               @Inject(forwardRef(() => ProgressieService)) private readonly progressieService: ProgressieService,
               private readonly mqttService: MqttService,
               private readonly configService: ConfigService,
               private readonly permissieService: PermissieService)
   {
      super();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number): Promise<RefLid>
   {
      this.logger.verbose(`LedenService.GetObject(${safeStringify({id})})`);
      const db = await this.dbService.refLid.findUnique({
         where: {
            ID: id
         }
      });
      if (!db)
         throw new HttpException(`Lid record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);

      const result = db;
      this.logger.verbose(`LedenService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal een enkel object op uit de database op basis van de inlognaam
   async GetObjectByInlognaam(loginname: string): Promise<RefLid>
   {
      this.logger.verbose(`LedenService.GetObjectByInlognaam(${safeStringify({loginname})})`);
      const result = await this.dbService.refLid.findMany({
         where: {
            INLOGNAAM: loginname,
            VERWIJDERD: false,
         }
      });

      if (!result) {
         this.logger.warn(`LedenService.GetObjectByInlognaam() => Lid record met INLOGNAAM ${loginname} niet gevonden`);
         throw new HttpException(`Lid met INLOGNAAM ${loginname} niet gevonden`, HttpStatus.NOT_FOUND);
      }

      if (result.length > 1) {
         this.logger.error(`LedenService.GetObjectByInlognaam() => Meerdere leden gevonden met INLOGNAAM ${loginname}`);
         throw new HttpException(`Meerdere lid records gevonden met INLOGNAAM ${loginname}`, HttpStatus.CONFLICT);
      }

      this.logger.verbose(`LedenService.GetObjectByInlognaam() => ${safeStringify(result[0])}`);
      return result[0];
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsRefLedenRequest | undefined): Promise<IHeliosGetObjectsResponse<GetObjectsRefLedenResponse>> {
      this.logger.verbose(`LedenService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
         params = MaakGetObjectsRequest(GetObjectsRefLedenRequest, {VERWIJDERD: false, CLUBLEDEN: true});
      const where: Prisma.RefLidWhereInput = {
         AND:
            [
               { ID: params.ID},
               { VERWIJDERD: params.VERWIJDERD ?? false},
               { ID: { in: params.IDs }},
               {
                  OR: [
                     { NAAM:        { contains: params.SELECTIE}},
                     { EMAIL:       { contains: params.SELECTIE}},
                     { TELEFOON:    { contains: params.SELECTIE}},
                     { MOBIEL:      { contains: params.SELECTIE}},
                     { NOODNUMMER:  { contains: params.SELECTIE}}
                  ]
               },
               { DDWV_CREW: params.DDWV_CREW},
               { BEHEERDER: params.BEHEERDERS},
               { INSTRUCTEUR: params.INSTRUCTEURS},
               { STARTLEIDER: params.STARTLEIDERS},
               { LIERIST: params.LIERISTEN},
               { LIERIST_IO: params.LIO},
               { BRANDSTOF_PAS: params.BRANDSTOF_PAS ? {not: null} : undefined},
               { LIDTYPE_ID: { in: params.TYPES}},
               { LIDTYPE_ID: params.CLUBLEDEN ? {in: [
                  LidType.Erelid, LidType.Lid, LidType.Jeugdlid,
                  LidType.PrivateOwner, LidType.Veteraan, LidType.Donateur
               ]} : undefined},
               // DDWV lid: mg enkel andere DDWV leden en DDWV crew zien
               { OR: params.DDWV_BEPERKING ? [
                  { LIDTYPE_ID: LidType.DDWV },
                  { DDWV_CREW: true }
               ] : undefined}
            ]
      }
      let count: number | undefined;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.refLid.count({where: where});
      }
      const objs = await this.dbService.refLid.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.RefLidOrderByWithRelationInput>(params.SORT ?? "ACHTERNAAM"),
         take: params.MAX,
         skip: params.START,
         include: {
            LidType: true,
            VliegStatus: true,
            Zusterclub: true,
            Buddy: true,
            Buddy2: true
         }
      });
      const dataset = await this.MaakGetObjectsResponseDataset(objs);
      const result = this.buildGetObjectsResponse(dataset, count, params.HASH);
      this.logger.verbose(`LedenService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.RefLidUncheckedCreateInput, actorId: number): Promise<RefLid>
   {
      this.logger.verbose(`LedenService.AddObject(${safeStringify({data})})`);
      await this.checkUniek('LIDNR', data.LIDNR as string | null | undefined);
      await this.checkUniek('INLOGNAAM', data.INLOGNAAM as string | null | undefined);

      const obj = await this.dbService.refLid.create({
         data: data
      });

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj, actorId);
      this.logger.verbose(`LedenService.AddObject() => ${safeStringify(obj)}`);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.RefLidUncheckedUpdateInput, actorId: number): Promise<RefLid>
   {
      this.logger.verbose(`LedenService.UpdateObject(${safeStringify({id, data})})`);
      const db = await this.GetObject(id);
      await this.checkUniek('LIDNR', data.LIDNR as string | null | undefined, id);
      await this.checkUniek('INLOGNAAM', data.INLOGNAAM as string | null | undefined, id);

      // DDWV leden zonder LIDNR krijgen er automatisch een 90xxxx lidnummer bij, zodat er een factuur verstuurd kan worden
      const lidtypeId = data.LIDTYPE_ID !== undefined ? data.LIDTYPE_ID as number : db.LIDTYPE_ID;
      if (!data.LIDNR && !db.LIDNR && lidtypeId === LidType.DDWV)
         data.LIDNR = `90${id}`;

      const obj = await this.dbService.refLid.update({
         where: {
            ID: id
         },
         data: data
      });
      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id, db, data, obj, actorId);
      this.logger.verbose(`LedenService.UpdateObject() => ${safeStringify(obj)}`);
      return obj;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`LedenService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.refLid.delete({
         where: {
            ID: id
         }
      });
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name,  id, db, actorId);
   }

   async GetVerjaardagen(aantal:number): Promise<VerjaardagenResponse[]>
   {
      this.logger.verbose(`LedenService.GetVerjaardagen(${safeStringify({aantal})})`);

      const params = MaakGetObjectsRequest(GetObjectsRefLedenRequest, {VERWIJDERD: false});
      const leden = await this.GetObjects(params)
      const l = leden.dataset.filter((f) => f.GEBOORTE_DATUM && this.permissieService.isLid(f));
      let jarigen = l.map((lid) =>
      {
         const {NAAM, GEBOORTE_DATUM,} = lid;

         const vandaag = new Date()
         const dag: number = GEBOORTE_DATUM.getDate()
         const maand: number = GEBOORTE_DATUM.getMonth()
         let leeftijd = new Date().getFullYear() - GEBOORTE_DATUM.getFullYear();
         let dagenTeGaan: number = (new Date(vandaag.getFullYear(), maand, dag).getTime() - vandaag.getTime()) / (1000 * 60 * 60 * 24);

         // `dagenTeGaan` is negatief als de verjaardag al is geweest, dus voor volgend jaar berekenen
         if (dagenTeGaan < 0) {
            dagenTeGaan = (new Date(vandaag.getFullYear() + 1, maand, dag).getTime() - vandaag.getTime()) / (1000 * 60 * 60 * 24);
            leeftijd++
         }

         return {
            NAAM: NAAM,
            DAG: dag,
            MAAND: maand +1,
            LEEFTIJD: leeftijd,
            SORT: dagenTeGaan
         }
      })
      jarigen = jarigen.filter((item) => item.SORT < 60).sort((a, b) => a.SORT - b.SORT).slice(0, aantal);
      jarigen.forEach(item => { delete item.SORT });
      const result = jarigen as VerjaardagenResponse[];
      this.logger.verbose(`LedenService.GetVerjaardagen() => ${safeStringify(result)}`);
      return result;
   }

   // genereert een nieuw, uniek lidnummer: jaar (4 cijfers) + volgnummer (2 cijfers, dus 6 cijfers totaal).
   // Als JAAR niet is opgegeven wordt gekeken naar het huidige jaar OF het volgende jaar (voor het geval de
   // nummering daar al op vooruitloopt) - aflopend gesorteerd is de eerste rij zowel het hoogste jaar als
   // het hoogste volgnummer daarbinnen, dus dat bepaalt in één keer zowel het jaar als het startpunt
   async NieuwLidNummer(jaar?: number): Promise<string>
   {
      this.logger.verbose(`LedenService.NieuwLidNummer(${safeStringify({jaar})})`);
      const huidigJaar = new Date().getFullYear();
      const kandidaatJaren = jaar !== undefined ? [jaar] : [huidigJaar, huidigJaar + 1];

      const laatste = await this.dbService.refLid.findFirst({
         where: {OR: kandidaatJaren.map((j) => ({LIDNR: {startsWith: String(j)}}))},
         orderBy: {LIDNR: 'desc'},
         select: {LIDNR: true}
      });

      const gebruiktJaar = jaar ?? (laatste ? Number(laatste.LIDNR.slice(0, 4)) : huidigJaar);
      const volgnummer = (laatste ? Number(laatste.LIDNR.slice(4)) : 0) + 1;
      if (volgnummer > 99)
         throw new HttpException(`Geen lidnummer meer beschikbaar voor jaar ${gebruiktJaar}`, HttpStatus.CONFLICT);

      const result = `${gebruiktJaar}${String(volgnummer).padStart(2, '0')}`;
      this.logger.verbose(`LedenService.NieuwLidNummer() => ${safeStringify(result)}`);
      return result;
   }

   // publiceert een lid op de MQTT bus voor externe synchronisatie
   // Enkel DDWV'ers en "club vliegers" worden gesynchroniseerd; wachtwoord wordt
   // alleen meegestuurd als het als platte tekst is meegegeven (bijv. net na een AddObject/UpdateObject
   // met een nieuw wachtwoord) - het gehashte WACHTWOORD veld zelf wordt nooit gepubliceerd
   async SyncLeden(id: number, wachtwoord?: string | null): Promise<void>
   {
      this.logger.verbose(`LedenService.SyncLeden(${safeStringify({id})})`);
      const lid = await this.GetObject(id);

      const magSynchroniseren = this.permissieService.isDDWVer(lid) || this.permissieService.isClubVlieger(lid);
      if (!magSynchroniseren)
      {
         this.logger.verbose(`LedenService.SyncLeden() => lidtype ${lid.LIDTYPE_ID} wordt niet gesynchroniseerd`);
         return;
      }

      const payload: Record<string, unknown> = {...lid, WACHTWOORD: null, SECRET: null};
      if (wachtwoord)
         payload.INGEVOERD_WACHTWOORD = wachtwoord;

      try
      {
         await this.mqttService.publish('sync', 'sync_leden', 'ref_leden', payload);
      }
      catch (err)
      {
         // een sync-fout mag AddObject/UpdateObject nooit laten falen - zie postMqttMessage() in
         // include/helios.php, die verbindingsfouten ook altijd zelf opvangt en enkel logt
         const foutmelding = err instanceof Error ? err.message : String(err);
         this.logger.error(`LedenService.SyncLeden: kon lid ${id} niet synchroniseren: ${foutmelding}`);
      }
   }

   // slaat een geuploade avatar-afbeelding op en zet AVATAR op het lid - zie UploadAvatar() in
   // class.Leden.inc.php. Deze aparte, gevalideerde upload-flow is de bedoelde manier voor een gewoon lid
   // om zijn eigen AVATAR te zetten (dat veld staat in normaliserenData() achter "enkel beheerder", zie
   // LedenController) - de bestandsvalidatie hier is zelf de waarborg, niet een rolcontrole op het veld
   async UploadAvatar(id: number, file: string, baseUrl: string, actorId: number): Promise<string>
   {
      this.logger.verbose(`LedenService.UploadAvatar(${safeStringify({id})})`);
      const lid = await this.GetObject(id);

      const gevonden = AVATAR_PREFIXEN.find(({prefix}) => file.startsWith(prefix));
      if (!gevonden)
         throw new HttpException(`Onjuiste bestandsextensie`, HttpStatus.UNPROCESSABLE_ENTITY);

      const afbeelding = Buffer.from(file.slice(gevonden.prefix.length), 'base64');
      const bestandsnaam = `${lid.INLOGNAAM ?? ''}-${this.tijdstempelYmdHis(new Date())}${gevonden.extensie}`;

      const avatarDir = this.configService.get<string>('app_settings.AvatarDir') ?? '/var/www/html/avatars';
      await fs.mkdir(avatarDir, {recursive: true});
      await fs.writeFile(join(avatarDir, bestandsnaam), afbeelding);

      const avatarUrl = `${baseUrl}/avatars/${bestandsnaam}`;
      await this.UpdateObject(id, {AVATAR: avatarUrl}, actorId);
      await this.SyncLeden(id);

      this.logger.verbose(`LedenService.UploadAvatar() => ${safeStringify(avatarUrl)}`);
      return avatarUrl;
   }

   // maak de dataset voor de GetObjects response, inclusief de relaties met andere tabellen: LidType/VliegStatus/Zusterclub/Buddy/Buddy2 via
   // reeds ge-include-de relaties, en PAX via een aparte gebatchte Progressie-lookup (geen directe relatie)
   private async MaakGetObjectsResponseDataset(objs: LidMetRelaties[]): Promise<GetObjectsRefLedenResponse[]>
   {
      this.logger.verbose(`LedenService.MaakGetObjectsResponseDataset(${safeStringify({objs})})`);

      // pax bevoegdheid: heeft het lid een progressie record voor de pax competentie? De progressie tabel is
      // niet van deze module - dus via ProgressieService.HeeftCompetentie() in plaats van een eigen query
      const paxLidIds = await this.progressieService.HeeftCompetentie(PAX_COMPETENTIE_ID, objs.map(obj => obj.ID));
      const ledenMetPax = new Set(paxLidIds);

      const result = objs.map((obj) => {
         const {
            LidType: lidType, VliegStatus: vliegStatus, Zusterclub: zusterclub,
            Buddy: buddy, Buddy2: buddy2, ...lid
         } = obj;

         return {
            ...lid,
            LIDTYPE: lidType?.OMSCHRIJVING ?? null,
            LIDTYPE_REF: lidType?.EXT_REF ?? null,
            STATUS: vliegStatus?.OMSCHRIJVING ?? null,
            ZUSTERCLUB: zusterclub?.NAAM ?? null,
            BUDDY: buddy?.NAAM ?? null,
            BUDDY2: buddy2?.NAAM ?? null,
            PAX: ledenMetPax.has(obj.ID),
         } as GetObjectsRefLedenResponse
      });
      this.logger.verbose(`LedenService.MaakGetObjectsResponseDataset() => ${safeStringify(result)}`);
      return result;
   }

   // voorkomt dat hetzelfde LIDNR of INLOGNAAM meerdere keren voorkomt -
   // Een null/undefined waarde wordt altijd toegestaan (meerdere leden zonder LIDNR / INLOGNAAMis prima),
   // bij een update wordt het eigen record uitgezonderd van de controle
   private async checkUniek(veld: 'LIDNR' | 'INLOGNAAM', waarde: string | null | undefined, uitgezonderdId?: number): Promise<void>
   {
      if (!waarde)
         return;

      this.logger.verbose(`LedenService.checkUniek(${safeStringify({veld, waarde, uitgezonderdId})})`);
      const bestaand = await this.dbService.refLid.findFirst({
         where: {
            [veld]: waarde,
            ID: uitgezonderdId !== undefined ? {not: uitgezonderdId} : undefined
         }
      });
      if (bestaand)
         throw new HttpException(`Record met ${veld}=${waarde} bestaat al`, HttpStatus.CONFLICT);
   }

   // zie PHP's date('YmdHis'), gebruikt in UploadAvatar() voor een unieke bestandsnaam
   private tijdstempelYmdHis(datum: Date): string
   {
      const pad = (getal: number) => String(getal).padStart(2, '0');
      return `${datum.getFullYear()}${pad(datum.getMonth() + 1)}${pad(datum.getDate())}${pad(datum.getHours())}${pad(datum.getMinutes())}${pad(datum.getSeconds())}`;
   }
}
