import {
   Body,
   Controller, Get,
   HttpException,
   HttpStatus,
   Logger,
   Query, UseGuards
} from '@nestjs/common';
import {Prisma, RefLid} from '@prisma/client';
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {
   HeliosController, HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject, HeliosGetObjects, HeliosRemoveObject,
   HeliosRestoreObject, HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {LedenService} from "./leden.service";
import {RefLidDto} from "../../generated/nestjs-dto/refLid.dto";
import { GetObjectsRefLedenRequest} from "./GetObjectsRefLedenRequest";
import {CreateRefLidDto} from "../../generated/nestjs-dto/create-refLid.dto";
import {UpdateRefLidDto} from "../../generated/nestjs-dto/update-refLid.dto";
import {GetObjectsRefLedenResponse} from "./GetObjectsRefLedenResponse";
import {ApiBasicAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags, getSchemaPath} from "@nestjs/swagger";
import {authenticator } from 'otplib';
import {ConfigService} from "@nestjs/config";
import {CurrentUser} from "../login/current-user.decorator";
import {PermissieService} from "../authorisatie/permissie.service";
import {AuthGuard} from "@nestjs/passport";
import {VerjaardagenResponse} from "./VerjaardagenResponse";
import {LidType} from "../../core/enums/LidType";
import {safeStringify} from "../../core/helpers/LogHelper";
import {parseDateOnly, toDateOnly} from "../../core/helpers/DateOnly";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import { hash } from "bcryptjs";

@Controller('Leden')
@ApiTags('Leden')
export class LedenController extends HeliosController
{
   private readonly logger = new Logger(LedenController.name);

   constructor(private readonly configService: ConfigService,
               private readonly ledenService: LedenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(RefLidDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<RefLidDto>
   {
      this.logger.verbose(`LedenController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Leden.GetObject');
      const obj =  await this.ledenService.GetObject(id);
      return this.privacyMask(obj, currentUser);
   }

   @HeliosGetObjects(GetObjectsRefLedenResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsRefLedenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsRefLedenResponse>>
   {
      this.logger.verbose(`LedenController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Leden.GetObjects');

      if (!this.permissieService.isBeheerderDDWV(currentUser) && !this.permissieService.isBeheerder(currentUser) && !this.permissieService.isStarttoren(currentUser)) {
         queryParams.TYPES = queryParams.TYPES ?? [];          // als TYPES niet is opgegeven, zet het op een lege array
         queryParams.TYPES.push(                               // voeg filter toe voor normale leden
            LidType.Student, LidType.Erelid, LidType.Lid, LidType.Jeugdlid,
            LidType.PrivateOwner, LidType.Veteraan, LidType.Donateur, LidType.DDWV,
         );
      }

      // haal de objects op uit de database op basis van de query parameters
      const objs = await this.ledenService.GetObjects (queryParams);

      // verwijder de privacygevoelige data uit de response, ook extra velden
      objs.dataset = objs.dataset.map(obj => this.privacyMask(obj, currentUser) as GetObjectsRefLedenResponse);
      return objs;
   }

   @HeliosCreateObject(CreateRefLidDto, RefLidDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateRefLidDto): Promise<RefLidDto>
   {
      this.logger.verbose(`LedenController.AddObject(${safeStringify({currentUser, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Leden.AddObject');
      bodyHeeftData(data);

      const insert = await this.normaliserenData(data, true) as Prisma.RefLidUncheckedCreateInput;
      const obj = await this.ledenService.AddObject(insert, currentUser.ID);
      return this.privacyMask(obj, currentUser);
   }

   @HeliosUpdateObject(UpdateRefLidDto, RefLidDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateRefLidDto): Promise<RefLid>
   {
      this.logger.verbose(`LedenController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Leden.UpdateObject');
      bodyHeeftData(data);

      id = id ?? data.ID;
      if ((currentUser.ID !== id) && !this.permissieService.isBeheerder(currentUser) && !this.permissieService.isBeheerderDDWV(currentUser)) {
         throw new HttpException(`Niet toegestaan om ander lid te wijzigen`, HttpStatus.UNAUTHORIZED);
      }

      const update = await this.normaliserenData(data, false) as Prisma.RefLidUncheckedUpdateInput;
      const obj = await this.ledenService.UpdateObject(id, update, currentUser.ID);
      return this.privacyMask(obj, currentUser);
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden, bouwt de
   // NAAM op, hasht het wachtwoord en normaliseert de datumvelden.
   // LIDTYPE_ID, STATUSTYPE_ID, ZUSTERCLUB_ID, BUDDY_ID en BUDDY_ID2 hoeven niet omgezet te worden naar
   // relatie-connects: met het Unchecked Prisma inputtype zijn dit al platte, nullable kolommen, dus een
   // meegegeven null zet de relatie direct los (zowel bij create als update) zonder aparte afhandeling
   private async normaliserenData(
      data: CreateRefLidDto | UpdateRefLidDto,
      naamAltijdOpbouwen: boolean): Promise<Prisma.RefLidUncheckedCreateInput | Prisma.RefLidUncheckedUpdateInput>
   {
      // NAAM, VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al
      // accepteert de DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een
      // meegegeven waarde wordt hier altijd genegeerd. VERWIJDERD wijzigt enkel via DeleteObject/RestoreObject
      delete data.NAAM;
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      const result = data as Prisma.RefLidUncheckedCreateInput | Prisma.RefLidUncheckedUpdateInput;
      const voornaam = result.VOORNAAM as string | null | undefined;
      const tussenvoegsel = result.TUSSENVOEGSEL as string | null | undefined;
      const achternaam = result.ACHTERNAAM as string | null | undefined;

      // bouw de naam op uit voornaam, tussenvoegsel en achternaam. Bij een update enkel als er
      // daadwerkelijk nieuwe naamgegevens zijn meegegeven, anders blijft de bestaande NAAM ongewijzigd
      if (naamAltijdOpbouwen || (typeof voornaam === "string" && typeof achternaam === "string"))
      {
         result.NAAM = [voornaam, tussenvoegsel, achternaam]
            .map(deel => (deel ?? "").trim())
            .filter(deel => deel.length > 0)
            .join(" ");
      }

      // encrypt het wachtwoord voordat het opgeslagen wordt in de database
      if (result.WACHTWOORD)
         result.WACHTWOORD = await hash(result.WACHTWOORD as string, 10);

      // zorg dat de datums omgezet worden in ISO 8601 formaat
      result.MEDICAL = parseDateOnly(result.MEDICAL as Date | string | null);
      result.GEBOORTE_DATUM = parseDateOnly(result.GEBOORTE_DATUM as Date | string | null);

      return result;
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`LedenController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Leden.DeleteObject');

      const data: Prisma.RefLidUpdateInput = {
         VERWIJDERD: true
      }
      await this.ledenService.UpdateObject(id, data, currentUser.ID);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`LedenController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Leden.RemoveObject');
      if (currentUser.ID === id) {
         throw new HttpException(`Je kunt jezelf niet verwijderen`, HttpStatus.UNAUTHORIZED);
      }
      await this.ledenService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`LedenController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Leden.RestoreObject');

      const data: Prisma.RefLidUpdateInput = {
         VERWIJDERD: false
      }
      await this.ledenService.UpdateObject(id, data, currentUser.ID);
   }


   // verwijder de privacygevoelige data uit de response
   privacyMask(obj: RefLid, currentUser: RefLid): RefLid
   {
      const ikBenHetZelf = this.permissieService.ikBenHetZelf(obj, currentUser);
      const isBeheerder = this.permissieService.isBeheerder(currentUser);
      const isBeheerderDDWV = this.permissieService.isBeheerderDDWV(currentUser);
      const isInstructeur = this.permissieService.isInstructeur(currentUser);
      const isCIMT = this.permissieService.isCIMT(currentUser);
      const isStarttoren = this.permissieService.isStarttoren(currentUser);

      this.logger.verbose(`LedenController.privacyMask(${safeStringify({obj, currentUser})})`);
      if (!ikBenHetZelf && !isBeheerder && !isBeheerderDDWV) {
         // verwijder de geheime info uit de response
         obj.INLOGNAAM = null;
         obj.AUTH = false;
      }

      obj.SECRET = null;
      obj.WACHTWOORD = null;

      // startverbod mag alleen door beheerder, instructeur of CIMT worden gezien. Of door het lid zelf natuurlijk
      if (!isBeheerder && !isBeheerderDDWV && !isInstructeur && !isCIMT && !ikBenHetZelf) {
         obj.STARTVERBOD = false;
      }

      // brevetnummer, knvvl nummer & zusterclub is alleen zichtbaar voor beheerders en beheerders DDWV, of het lid zelf
      if (!isBeheerder && !isBeheerderDDWV && !isCIMT && !ikBenHetZelf) {
         obj.BREVET_NUMMER = null;
         obj.KNVVL_LIDNUMMER = null;
         obj.ZUSTERCLUB_ID = null;
      }

      // tegoed is alleen intressant voor beheerders en beheerders DDWV, of het lid zelf
      if (!isBeheerder && !isBeheerderDDWV && !ikBenHetZelf) {
         obj.TEGOED = null;
      }

      // buddy is alleen zichtbaar voor beheerders, instructeurs en CIMT, of het lid zelf
      if (!isBeheerder && !isInstructeur && !isCIMT && !ikBenHetZelf) {
          obj.BUDDY_ID = null;
          obj.BUDDY_ID2 = null;
      }

      // medical is alleen zichtbaar voor beheerders, instructeurs, CIMT, starttoren, of het lid zelf
      if (!isBeheerder && !isInstructeur && !isCIMT && !ikBenHetZelf && !isStarttoren) {
          obj.MEDICAL = null
      }

      // als gebruiker privacy settings heeft, dan worden de gegevens gemaskeerd
      if (this.permissieService.hasPrivacy(currentUser) && !ikBenHetZelf)
      {
         // controleer of de gebruiker privacy-instellingen heeft ingeschakeld
         // als de gebruiker een beheerder, beheerder DDWV, instructeur of CIMT is, worden de privacy-instellingen genegeerd
         obj.ADRES = "****";
         obj.POSTCODE = "****";
         obj.WOONPLAATS = "****";
         obj.TELEFOON = null
         obj.MOBIEL = null
         obj.NOODNUMMER = null
         obj.GEBOORTE_DATUM = null
         obj.AVATAR = null;
         obj.LIDNR = null;
         obj.STATUSTYPE_ID = null;
      }

      // GEBOORTE_DATUM en MEDICAL zijn datums zonder tijdscomponent, geef enkel de datum (yyyy-MM-dd) terug
      obj.GEBOORTE_DATUM = toDateOnly(obj.GEBOORTE_DATUM) as unknown as Date;
      obj.MEDICAL = toDateOnly(obj.MEDICAL) as unknown as Date;

      return obj as RefLid;
   }


   //------------- Specifieke endpoints staan hieronder --------------------//

   @Get("Verjaardagen")
   @ApiExtraModels(VerjaardagenResponse)
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiOperation({ summary: 'Komende verjaardagen.' })
   @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data.' })
   @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.' })
   @ApiResponse({ status: HttpStatus.OK, description: 'Data opgehaald.',   schema: {
         type: 'object',
         properties:
            {
               items: {$ref: getSchemaPath(VerjaardagenResponse)},

            }
      }})
   async GetVerjaardagen(
      @CurrentUser() currentUser: RefLid,
      @Query('AANTAL') aantal?: number): Promise<VerjaardagenResponse[]>
   {
      this.logger.verbose(`LedenController.GetVerjaardagen(${safeStringify({currentUser, aantal})})`);
      this.permissieService.heeftToegang(currentUser, 'Leden.GetVerjaardagen');
      return await this.ledenService.GetVerjaardagen(aantal);
   }
}
