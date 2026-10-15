import {forwardRef, HttpException, HttpStatus, Inject, Injectable, Logger, OnApplicationBootstrap} from '@nestjs/common';
import {DiscoveryService, MetadataScanner, Reflector} from '@nestjs/core';
import {METHOD_METADATA, PATH_METADATA} from '@nestjs/common/constants';
import {EventEmitter2} from "@nestjs/event-emitter";
import {Prisma, RefLid, RefPermissie} from '@prisma/client';
import {LidType} from '../../core/enums/LidType';
import {Rol, RolKolom} from '../../core/enums/Rol';
import {TypesGroep} from '../../core/enums/TypesGroep';
import {safeStringify} from "../../core/helpers/LogHelper";
import {DbService} from "../../database/db-service/db.service";
import {IHeliosService} from "../../core/services/IHeliosService";
import {DatabaseEvents} from "../../core/helpers/Events";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";
import {TypesService} from "../types/types.service";
import {GetObjectsRefPermissieRequest} from "./GetObjectsRefPermissieRequest";

// rechten die geen endpoint zijn, maar wel via heeftToegang() gecontroleerd worden binnen een endpoint
const EXTRA_FUNCTIES = ['Diensten.AddObject.AndersLid'];

@Injectable()
export class PermissieService extends IHeliosService implements OnApplicationBootstrap
{
   private readonly logger = new Logger(PermissieService.name);

   // alle endpoints van de applicatie (zie GetEndpoints) en per endpoint de rollen die er toegang toe hebben
   // (ref_permissie). Beide worden bij het opstarten geladen, de permissies opnieuw na elke wijziging
   private endpoints: string[] = [];
   private permissies = new Map<string, Set<number>>();

   // TypesService wordt via forwardRef() geinjecteerd: TypesModule importeert AuthorisatieModule en andersom
   constructor(private readonly dbService: DbService,
               private readonly eventEmitter: EventEmitter2,
               private readonly discoveryService: DiscoveryService,
               private readonly metadataScanner: MetadataScanner,
               private readonly reflector: Reflector,
               @Inject(forwardRef(() => TypesService)) private readonly typesService: TypesService)
   {
      super();
   }

   async onApplicationBootstrap(): Promise<void>
   {
      this.endpoints = this.zoekEndpoints();
      await this.laadPermissies();
   }

   // haal een enkel object op uit de database op basis van het ID
   async GetObject(id: number): Promise<RefPermissie>
   {
      this.logger.verbose(`PermissieService.GetObject(${safeStringify({id})})`);
      const db = await this.dbService.refPermissie.findUnique({
         where: {
            ID: id
         }
      });
      if (!db)
         throw new HttpException(`Permissie record met ID ${id} niet gevonden`, HttpStatus.NOT_FOUND);

      const result = db;
      this.logger.verbose(`PermissieService.GetObject() => ${safeStringify(result)}`);
      return result;
   }

   // haal objects op uit de database op basis van de query parameters
   async GetObjects(params?: GetObjectsRefPermissieRequest): Promise<IHeliosGetObjectsResponse<RefPermissie>>
   {
      this.logger.verbose(`PermissieService.GetObjects(${safeStringify({params})})`);
      if (params === undefined)
         params = MaakGetObjectsRequest(GetObjectsRefPermissieRequest, {VERWIJDERD: false});
      const where: Prisma.RefPermissieWhereInput =
      {
         AND:
         [
            { ID: params.ID},
            { VERWIJDERD: params.VERWIJDERD ?? false},
            { ID: { in: params.IDs }},
            { ROL_ID: params.ROL_ID},
            { ENDPOINT: params.ENDPOINT},
         ]
      }
      let count;
      if (params.MAX !== undefined || params.START !== undefined)
      {
         count = await this.dbService.refPermissie.count({where: where});
      }
      const objs = await this.dbService.refPermissie.findMany({
         where: where,
         orderBy: this.SortStringToSortObj<Prisma.RefPermissieOrderByWithRelationInput>(params.SORT ?? "ENDPOINT, ROL_ID"),
         take: params.MAX,
         skip: params.START,
      });

      const dataset = objs;
      const result = this.buildGetObjectsResponse(dataset, count, params.HASH);
      this.logger.verbose(`PermissieService.GetObjects() => ${safeStringify(result)}`);
      return result;
   }

   async AddObject(data: Prisma.RefPermissieUncheckedCreateInput, actorId: number): Promise<RefPermissie>
   {
      this.logger.verbose(`PermissieService.AddObject(${safeStringify({data})})`);
      this.controleerEndpoint(data.ENDPOINT);
      await this.controleerRol(data.ROL_ID);
      await this.checkUniek(data.ROL_ID, data.ENDPOINT);

      const obj = await this.dbService.refPermissie.create({
         data: data
      });
      await this.laadPermissies();

      this.eventEmitter.emit(DatabaseEvents.Created, this.constructor.name, obj.ID, data, obj, actorId);
      this.logger.verbose(`PermissieService.AddObject() => ${safeStringify(obj)}`);
      return obj;
   }

   async UpdateObject(id: number, data: Prisma.RefPermissieUncheckedUpdateInput, actorId: number): Promise<RefPermissie>
   {
      this.logger.verbose(`PermissieService.UpdateObject(${safeStringify({id, data})})`);
      const db = await this.GetObject(id);
      if (data.ENDPOINT !== undefined)
         this.controleerEndpoint(data.ENDPOINT as string);
      if (data.ROL_ID !== undefined)
         await this.controleerRol(data.ROL_ID as number);
      if (data.ENDPOINT !== undefined || data.ROL_ID !== undefined)
         await this.checkUniek((data.ROL_ID ?? db.ROL_ID) as number, (data.ENDPOINT ?? db.ENDPOINT) as string, id);

      const obj = await this.dbService.refPermissie.update({
         where: {
            ID: id
         },
         data: data
      });
      await this.laadPermissies();

      this.eventEmitter.emit(DatabaseEvents.Updated, this.constructor.name, id, db, data, obj, actorId);
      this.logger.verbose(`PermissieService.UpdateObject() => ${safeStringify(obj)}`);
      return obj;
   }

   async RemoveObject(id: number, actorId: number): Promise<void>
   {
      this.logger.verbose(`PermissieService.RemoveObject(${safeStringify({id, actorId})})`);
      const db = await this.GetObject(id);
      if (!db.VERWIJDERD) {
         throw new HttpException(`Record moet eerst gemarkeerd worden als verwijderd (VERWIJDERD) voordat het permanent verwijderd kan worden`, HttpStatus.METHOD_NOT_ALLOWED);
      }
      await this.dbService.refPermissie.delete({
         where: {
            ID: id
         }
      });
      await this.laadPermissies();
      this.eventEmitter.emit(DatabaseEvents.Removed, this.constructor.name, id, db, actorId);
   }

   // alle endpoints van de applicatie (<controller pad>.<methode>, bijv Leden.UpdateObject), de extra rechten
   // en per module een wildcard (bijv Leden.*). Dit zijn de geldige waarden voor ENDPOINT in ref_permissie
   GetEndpoints(): string[]
   {
      this.logger.verbose(`PermissieService.GetEndpoints()`);
      return this.endpoints;
   }

   // controleer of de gebruiker toegang heeft tot de functie (endpoint), anders UNAUTHORIZED. Een beheerder heeft
   // altijd toegang. Anders moet een van de rollen van de gebruiker (ROLLEN_ID, de oude booleans, het lidtype en
   // de impliciete rol Iedereen) in ref_permissie toegang hebben tot de functie zelf of tot alle endpoints van de
   // module (<module>.*)
   heeftToegang(user: RefLid, functie: string): void
   {
      this.logger.verbose(`PermissieService.heeftToegang(${safeStringify({NAAM: user.NAAM, functie})})`);
      if (this.isBeheerder(user))
         return;

      const rollen = new Set<number>((user.ROLLEN_ID ?? "").split(",").filter(Boolean).map(Number));
      rollen.add(Rol.Iedereen);
      // TODO : de oude booleans in ref_leden worden uitgefaseerd, dus dit kan later weg
      Object.entries(RolKolom).filter(([, kolom]) => user[kolom]).forEach(([rol]) => rollen.add(Number(rol)));
      if (user.LIDTYPE_ID)
         rollen.add(user.LIDTYPE_ID);

      const module = functie.split(".")[0];
      const toegestaan = [...(this.permissies.get(functie) ?? []), ...(this.permissies.get(`${module}.*`) ?? [])];
      if (!toegestaan.some(rol => rollen.has(rol)))
         throw new HttpException(`Geen toegang tot ${functie}`, HttpStatus.UNAUTHORIZED);
   }

   // Overgangssituatie: een rol is actief als de (oude) boolean in ref_leden gezet is, of als de rol
   // voorkomt in ROLLEN_ID (ref_types met GROEP = TypesGroep.Rollen). Zodra de booleans uitgefaseerd zijn
   // vervalt het eerste deel van de controle
   isBeheerder(user: RefLid): boolean
   {
      const result = user.BEHEERDER || this.heeftRol(user, Rol.Beheerder);
      this.logger.verbose(`PermissieService.isBeheerder(${safeStringify({NAAM: user.NAAM, BEHEERDER: user.BEHEERDER, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isBeheerderDDWV(user: RefLid): boolean
   {
      const result = user.DDWV_BEHEERDER || this.heeftRol(user, Rol.DDWVBeheerder);
      this.logger.verbose(`PermissieService.isBeheerderDDWV(${safeStringify({NAAM: user.NAAM, DDWV_BEHEERDER: user.DDWV_BEHEERDER, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isInstructeur(user: RefLid): boolean
   {
      const result = user.INSTRUCTEUR || this.heeftRol(user, Rol.Instructeur);
      this.logger.verbose(`PermissieService.isInstructeur(${safeStringify({NAAM: user.NAAM, INSTRUCTEUR: user.INSTRUCTEUR, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isCIMT(user: RefLid): boolean
   {
      const result = user.CIMT || this.heeftRol(user, Rol.CIMT);
      this.logger.verbose(`PermissieService.isCIMT(${safeStringify({NAAM: user.NAAM, CIMT: user.CIMT, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isStarttoren(user: RefLid): boolean
   {
      const result = user.STARTTOREN || this.heeftRol(user, Rol.Starttoren);
      this.logger.verbose(`PermissieService.isStarttoren(${safeStringify({NAAM: user.NAAM, STARTTOREN: user.STARTTOREN, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isRooster(user: RefLid): boolean
   {
      const result = user.ROOSTER || this.heeftRol(user, Rol.Rooster);
      this.logger.verbose(`PermissieService.isRooster(${safeStringify({NAAM: user.NAAM, ROOSTER: user.ROOSTER, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isRapporteur(user: RefLid): boolean
   {
      const result = user.RAPPORTEUR || this.heeftRol(user, Rol.Rapporteur);
      this.logger.verbose(`PermissieService.isRapporteur(${safeStringify({NAAM: user.NAAM, RAPPORTEUR: user.RAPPORTEUR, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isDDWVCrew(user: RefLid): boolean
   {
      const result = user.DDWV_CREW || this.heeftRol(user, Rol.DDWVCrew);
      this.logger.verbose(`PermissieService.isDDWVCrew(${safeStringify({NAAM: user.NAAM, DDWV_CREW: user.DDWV_CREW, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isLierist(user: RefLid): boolean
   {
      const result = user.LIERIST || this.heeftRol(user, Rol.Lierist);
      this.logger.verbose(`PermissieService.isLierist(${safeStringify({NAAM: user.NAAM, LIERIST: user.LIERIST, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isLIO(user: RefLid): boolean
   {
      const result = user.LIERIST_IO || this.heeftRol(user, Rol.LIO);
      this.logger.verbose(`PermissieService.isLIO(${safeStringify({NAAM: user.NAAM, LIERIST_IO: user.LIERIST_IO, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isStartleider(user: RefLid): boolean
   {
      const result = user.STARTLEIDER || this.heeftRol(user, Rol.Startleider);
      this.logger.verbose(`PermissieService.isStartleider(${safeStringify({NAAM: user.NAAM, STARTLEIDER: user.STARTLEIDER, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isTechnicus(user: RefLid): boolean
   {
      const result = user.TECHNICUS || this.heeftRol(user, Rol.Technicus);
      this.logger.verbose(`PermissieService.isTechnicus(${safeStringify({NAAM: user.NAAM, TECHNICUS: user.TECHNICUS, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isSleepvlieger(user: RefLid): boolean
   {
      const result = user.SLEEPVLIEGER || this.heeftRol(user, Rol.Sleepvlieger);
      this.logger.verbose(`PermissieService.isSleepvlieger(${safeStringify({NAAM: user.NAAM, SLEEPVLIEGER: user.SLEEPVLIEGER, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isGastenvlieger(user: RefLid): boolean
   {
      const result = user.GASTENVLIEGER || this.heeftRol(user, Rol.Gastenvlieger);
      this.logger.verbose(`PermissieService.isGastenvlieger(${safeStringify({NAAM: user.NAAM, GASTENVLIEGER: user.GASTENVLIEGER, ROLLEN_ID: user.ROLLEN_ID, result})})`);
      return result;
   }

   isLid(user: RefLid): boolean
   {
      const result =
             user.LIDTYPE_ID === LidType.Erelid ||
             user.LIDTYPE_ID === LidType.Lid ||
             user.LIDTYPE_ID === LidType.Jeugdlid ||
             user.LIDTYPE_ID === LidType.Veteraan ||
             user.LIDTYPE_ID === LidType.PrivateOwner ||
             user.LIDTYPE_ID === LidType.Rittenkaart ||
             user.LIDTYPE_ID === LidType.Cursist ||
             user.LIDTYPE_ID === LidType.Donateur;
      this.logger.verbose(`PermissieService.isLid(${safeStringify({NAAM: user.NAAM, TYPE: user.LIDTYPE_ID, lid: result})})`);
      return result;
   }

   isDDWVer(user: RefLid): boolean
   {
      this.logger.verbose(`PermissieService.isDDWVer(${safeStringify({NAAM: user.NAAM, ddwv: user.LIDTYPE_ID === LidType.DDWV})})`);
      return user.LIDTYPE_ID === LidType.DDWV;
   }

   // zie isClubVlieger() in class.Leden.inc.php - anders dan isLid() hierboven telt Student hier ook mee
   isClubVlieger(user: RefLid): boolean
   {
      const result =
             user.LIDTYPE_ID === LidType.Student ||
             user.LIDTYPE_ID === LidType.Erelid ||
             user.LIDTYPE_ID === LidType.Lid ||
             user.LIDTYPE_ID === LidType.Jeugdlid ||
             user.LIDTYPE_ID === LidType.PrivateOwner ||
             user.LIDTYPE_ID === LidType.Veteraan ||
             user.LIDTYPE_ID === LidType.Donateur ||
             user.LIDTYPE_ID === LidType.Rittenkaart ||
             user.LIDTYPE_ID === LidType.Cursist;
      this.logger.verbose(`PermissieService.isClubVlieger(${safeStringify({NAAM: user.NAAM, TYPE: user.LIDTYPE_ID, clubVlieger: result})})`);
      return result;
   }

   isSysteemAccount(user: RefLid): boolean
   {
      this.logger.verbose(`PermissieService.isSysteemAccount(${safeStringify({NAAM: user.NAAM, systeemAccount: user.LIDTYPE_ID === LidType.SysteemAccount})})`);
      return user.LIDTYPE_ID === LidType.SysteemAccount;
   }

   ikBenHetZelf(user: RefLid, currentUser: RefLid): boolean
   {
      this.logger.verbose(`PermissieService.ikBenHetZelf(${safeStringify({NAAM: user.NAAM, CURRENT_USER: currentUser.NAAM, result: user.ID === currentUser.ID})})`);
      return user.ID === currentUser.ID;
   }

   // controleer of de gebruiker privacy-instellingen heeft ingeschakeld
   // als de gebruiker een beheerder, beheerder DDWV, instructeur of CIMT is, zijn de privacy-instellingen niet van toepassing
   hasPrivacy(user: RefLid): boolean
   {
      if (this.isBeheerder(user) || this.isBeheerderDDWV(user) || this.isInstructeur(user) || this.isCIMT(user) || this.isStarttoren(user))
      {
         this.logger.verbose(`PermissieService.hasPrivacy(${safeStringify({NAAM: user.NAAM})}) = false, beheerder `);
         return false;
      }
      this.logger.verbose(`PermissieService.hasPrivacy(${safeStringify({NAAM: user.NAAM})}) => ${safeStringify(user.PRIVACY)}`);
      return user.PRIVACY;;
   }

   // controleer of de rol voorkomt in de comma-separated ROLLEN_ID lijst van het lid
   private heeftRol(user: RefLid, rol: Rol): boolean
   {
      return (user.ROLLEN_ID ?? "").split(",").filter(Boolean).map(Number).includes(rol);
   }

   // zoek via de NestJS discovery alle controller methodes met een route (GET, POST, ...) op
   private  zoekEndpoints(): string[]
   {
      const endpoints = new Set<string>(EXTRA_FUNCTIES);
      for (const controller of this.discoveryService.getControllers())
      {
         const {instance, metatype} = controller;
         if (!instance || !metatype)
            continue;

         const pad = [this.reflector.get<string | string[]>(PATH_METADATA, metatype)].flat()[0];
         const prototype = Object.getPrototypeOf(instance);
         for (const methode of this.metadataScanner.getAllMethodNames(prototype))
         {
            if (this.reflector.get(METHOD_METADATA, prototype[methode]) !== undefined)
               endpoints.add(`${pad}.${methode}`);
         }
      }
      [...endpoints].forEach(endpoint => endpoints.add(`${endpoint.split(".")[0]}.*`));

      const result = [...endpoints].sort();
      this.logger.verbose(`PermissieService.zoekEndpoints() => ${safeStringify(result)}`);
      return result;
   }

   // laad de (niet verwijderde) permissies in het geheugen, zodat heeftToegang() geen database query nodig heeft
   private async laadPermissies(): Promise<void>
   {
      const objs = await this.dbService.refPermissie.findMany({where: {VERWIJDERD: false}});
      const permissies = new Map<string, Set<number>>();
      for (const obj of objs)
         permissies.set(obj.ENDPOINT, (permissies.get(obj.ENDPOINT) ?? new Set<number>()).add(obj.ROL_ID));
      this.permissies = permissies;
      this.logger.verbose(`PermissieService.laadPermissies() => ${objs.length} permissies`);
   }

   // het endpoint moet bestaan in de applicatie, zie GetEndpoints()
   private controleerEndpoint(endpoint: string): void
   {
      if (!this.endpoints.includes(endpoint))
         throw new HttpException(`Onbekend endpoint ${endpoint}, zie Permissie/GetEndpoints`, HttpStatus.BAD_REQUEST);
   }

   // de rol moet een (niet verwijderd) type zijn uit de groep Rollen of een lidtype uit de groep Lidmaatschap
   private async controleerRol(rolId: number): Promise<void>
   {
      const type = await this.typesService.GetObject(rolId).catch(() => undefined);
      if (!type || type.VERWIJDERD || ![TypesGroep.Rollen, TypesGroep.Lidmaatschap].includes(type.GROEP))
         throw new HttpException(`ROL_ID ${rolId} is geen rol of lidtype`, HttpStatus.BAD_REQUEST);
   }

   // een rol kan maar een keer toegang krijgen tot hetzelfde endpoint, ook niet als het bestaande record verwijderd is
   private async checkUniek(rolId: number, endpoint: string, uitgezonderdId?: number): Promise<void>
   {
      const bestaand = await this.dbService.refPermissie.findFirst({
         where: {
            ROL_ID: rolId,
            ENDPOINT: endpoint,
            ID: uitgezonderdId !== undefined ? {not: uitgezonderdId} : undefined
         }
      });
      if (bestaand)
         throw new HttpException(`Permissie voor rol ${rolId} op ${endpoint} bestaat al (ID ${bestaand.ID})`, HttpStatus.CONFLICT);
   }
}
