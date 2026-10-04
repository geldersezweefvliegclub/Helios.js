import {
   Body,
   Controller, Get, Post, Req,
   HttpException,
   HttpStatus,
   Logger,
   Query, UseGuards
} from '@nestjs/common';
import {Request} from "express";
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
import {ConfigService} from "@nestjs/config";
import {CurrentUser} from "../login/current-user.decorator";
import {PermissieService} from "../authorisatie/permissie.service";
import {AuthGuard} from "@nestjs/passport";
import {VerjaardagenResponse} from "./VerjaardagenResponse";
import {NieuwLidNummerRequest} from "./NieuwLidNummerRequest";
import {NieuwLidNummerResponse} from "./NieuwLidNummerResponse";
import {UploadAvatarRequest} from "./UploadAvatarRequest";
import {LidType} from "../../core/enums/LidType";
import {safeStringify} from "../../core/helpers/LogHelper";
import {parseDateOnly, toDateOnly} from "../../core/helpers/TimeDate";
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
      this.heeftDataToegangGetObject(currentUser);
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
      this.heeftDataToegangGetObjects(currentUser);

      // zie GetObjects() in class.Leden.inc.php: een DDWV-only lid krijgt een smallere beperking (enkel
      // DDWV leden/crew) dan een gewoon lid (alle "clubleden" types) - dit zijn twee losse takken, geen
      // opeenstapeling van filters
      if (this.permissieService.isDDWVer(currentUser)) {
         queryParams.DDWV_BEPERKING = true;
      }
      else if (!this.permissieService.isBeheerderDDWV(currentUser) && !this.permissieService.isBeheerder(currentUser) && !this.permissieService.isStarttoren(currentUser)) {
         const toegestaneTypes = [
            LidType.Student, LidType.Erelid, LidType.Lid, LidType.Jeugdlid,
            LidType.PrivateOwner, LidType.Veteraan, LidType.Donateur, LidType.DDWV,
         ];
         queryParams.TYPES = queryParams.TYPES
            ? queryParams.TYPES.filter(t => toegestaneTypes.includes(t))
            : toegestaneTypes;
      }

      // haal de objects op uit de database op basis van de query parameters
      const objs = await this.ledenService.GetObjects (queryParams);

      // verwijder de privacygevoelige data uit de response, ook extra velden
      objs.dataset = objs.dataset.map(obj => this.privacyMask(obj, currentUser) as GetObjectsRefLedenResponse);
      return objs;
   }

   @HeliosCreateObject(CreateRefLidDto, RefLidDto)
   // NAAM (of ACHTERNAAM) en LIDTYPE_ID zijn verplicht (BAD_REQUEST), LIDNR/INLOGNAAM moeten uniek zijn
   // (CONFLICT) - zie AddObject() in class.Leden.inc.php. Beide statussen staan al generiek in HeliosCreateObject
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateRefLidDto): Promise<RefLidDto>
   {
      this.logger.verbose(`LedenController.AddObject(${safeStringify({currentUser, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Leden.AddObject');
      this.heeftDataToegangAddObject(currentUser);
      bodyHeeftData(data);

      if (!data.NAAM && !data.ACHTERNAAM)
         throw new HttpException(`NAAM is verplicht`, HttpStatus.BAD_REQUEST);
      if (!data.LIDTYPE_ID)
         throw new HttpException(`Lidtype is verplicht`, HttpStatus.BAD_REQUEST);

      // op AddObject bestaat het lid nog niet - de zelf-of-beheerder velden (naam, adres, ...) worden hier
      // altijd toegestaan, zodat een nieuw lid zijn eigen gegevens kan invullen. Bevoegdheids-gevoelige
      // velden (BEHEERDER, CIMT, TEGOED, ...) blijven wel per-veld rolgebonden, zie normaliserenData()
      // WACHTWOORD wordt in normaliserenData() gehasht - het originele platte-tekst wachtwoord grijpen we
      // hier alvast, voordat het weg is, voor SyncLeden() (zie AddObject() in class.Leden.inc.php)
      const wachtwoordPlain = data.WACHTWOORD;
      const insert = await this.normaliserenData(data, true, currentUser, true) as Prisma.RefLidUncheckedCreateInput;
      const obj = await this.ledenService.AddObject(insert, currentUser.ID);
      await this.ledenService.SyncLeden(obj.ID, wachtwoordPlain);
      return this.privacyMask(obj, currentUser);
   }

   @HeliosUpdateObject(UpdateRefLidDto, RefLidDto)
   // LIDNR/INLOGNAAM moeten uniek zijn (CONFLICT) - staat al generiek in HeliosUpdateObject
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateRefLidDto): Promise<RefLid>
   {
      this.logger.verbose(`LedenController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Leden.UpdateObject');
      this.heeftDataToegangUpdateObject(currentUser, id ?? data.ID);
      bodyHeeftData(data);

      id = id ?? data.ID;
      const ikBenHetZelf = currentUser.ID === id;

      // huidige databasewaarden nodig om te bepalen of dit lid een bijzondere rol heeft (zie
      // normaliserenData()/isSpecialeRol()) - een niet-bestaand ID wordt hier genegeerd, net als in PHP's
      // RequestToRecord(); ledenService.UpdateObject() hieronder geeft dan alsnog de reguliere 404
      const dbLid = await this.ledenService.GetObject(id).catch(() => undefined);
      const wachtwoordPlain = data.WACHTWOORD;

      const update = await this.normaliserenData(data, false, currentUser, ikBenHetZelf, dbLid) as Prisma.RefLidUncheckedUpdateInput;
      const obj = await this.ledenService.UpdateObject(id, update, currentUser.ID);
      await this.ledenService.SyncLeden(id, wachtwoordPlain);
      return this.privacyMask(obj, currentUser);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`LedenController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Leden.DeleteObject');
      this.heeftDataToegangDeleteObject(currentUser);

      const data: Prisma.RefLidUpdateInput = {
         VERWIJDERD: true
      }
      await this.ledenService.UpdateObject(id, data, currentUser.ID);
      await this.ledenService.SyncLeden(id);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`LedenController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Leden.RemoveObject');
      this.heeftDataToegangRemoveObject(currentUser);
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
      this.heeftDataToegangRestoreObject(currentUser);

      const data: Prisma.RefLidUpdateInput = {
         VERWIJDERD: false
      }
      await this.ledenService.UpdateObject(id, data, currentUser.ID);
      await this.ledenService.SyncLeden(id);
   }


   // verwijder de privacygevoelige data uit de response - zie privacyMask() in class.Leden.inc.php
   privacyMask(obj: RefLid, currentUser: RefLid): RefLid
   {
      const ikBenHetZelf = this.permissieService.ikBenHetZelf(obj, currentUser);
      const isBeheerder = this.permissieService.isBeheerder(currentUser);
      const isBeheerderDDWV = this.permissieService.isBeheerderDDWV(currentUser);
      const isInstructeur = this.permissieService.isInstructeur(currentUser);
      const isCIMT = this.permissieService.isCIMT(currentUser);
      const isStarttoren = this.permissieService.isStarttoren(currentUser);
      const isRooster = this.permissieService.isRooster(currentUser);

      this.logger.verbose(`LedenController.privacyMask(${safeStringify({obj, currentUser})})`);
      if (!ikBenHetZelf && !isBeheerder && !isBeheerderDDWV) {
         // verwijder de geheime info uit de response
         obj.INLOGNAAM = null;
         obj.AUTH = false;
      }

      obj.SECRET = null;
      obj.WACHTWOORD = null;

      // startverbod mag alleen door beheerder, beheerder DDWV, instructeur, CIMT of starttoren worden
      // gezien. Of door het lid zelf natuurlijk - zie privacyMask() in class.Leden.inc.php
      if (!isBeheerder && !isBeheerderDDWV && !isInstructeur && !isCIMT && !isStarttoren && !ikBenHetZelf) {
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

      // medical en noodnummer zijn onvoorwaardelijk verborgen voor niet-geprivilegieerde bekijkers - dit
      // staat los van de PRIVACY instelling van het lid zelf, zie privacyMask() in class.Leden.inc.php
      if (!isBeheerder && !isBeheerderDDWV && !isInstructeur && !isCIMT && !isStarttoren && !ikBenHetZelf) {
          obj.MEDICAL = null
          obj.NOODNUMMER = null
      }

      // DIENSTEN enkel zichtbaar voor beheerder, roostermaker, of het lid zelf
      if (!isBeheerder && !isRooster && !ikBenHetZelf) {
         obj.DIENSTEN = null;
      }

      // OPMERKINGEN enkel zichtbaar voor beheerder, instructeur, CIMT, roostermaker, of het lid zelf
      // (netto-effect van de twee overlappende maskeringsblokken in privacyMask() in class.Leden.inc.php)
      if (!isBeheerder && !isInstructeur && !isCIMT && !isRooster && !ikBenHetZelf) {
         obj.OPMERKINGEN = null;
      }

      // de PRIVACY instelling van het BEKEKEN lid OF van de kijker zelf bepaalt of onderstaande velden
      // gemaskeerd worden - zie privacyMask($lid, $privacy) in class.Leden.inc.php: GetObject()/GetObjects()
      // geven daar altijd de PRIVACY vlag van de INGELOGDE gebruiker aan mee, dus een privacy-bewuste kijker
      // krijgt deze velden ook van ANDERE leden verborgen, niet alleen van zichzelf. Geprivilegieerde
      // bekijkers (beheerder, beheerder DDWV, instructeur, CIMT, starttoren) zien deze velden altijd
      if (!isBeheerder && !isBeheerderDDWV && !isInstructeur && !isCIMT && !isStarttoren && !ikBenHetZelf
         && (obj.PRIVACY === true || currentUser.PRIVACY === true))
      {
         obj.ADRES = "****";
         obj.POSTCODE = "****";
         obj.WOONPLAATS = "****";
         obj.TELEFOON = null
         obj.MOBIEL = null
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
      this.heeftDataToegangGetVerjaardagen(currentUser);

      // DDWV-only leden krijgen geen verjaardagen te zien - zie GetVerjaardagen() in class.Leden.inc.php
      if (this.permissieService.isDDWVer(currentUser))
         return [];

      return await this.ledenService.GetVerjaardagen(aantal);
   }

   @Get("nieuwLidNummer")
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiOperation({summary: 'Genereer een nieuw, uniek lidnummer (jaar + 2-cijferig volgnummer).'})
   @ApiResponse({status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({status: HttpStatus.CONFLICT, description: 'Geen volgnummer meer beschikbaar voor dit jaar.'})
   @ApiResponse({status: HttpStatus.OK, description: 'Lidnummer gegenereerd.', type: NieuwLidNummerResponse})
   async NieuwLidNummer(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: NieuwLidNummerRequest): Promise<NieuwLidNummerResponse>
   {
      this.logger.verbose(`LedenController.NieuwLidNummer(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Leden.NieuwLidNummer');
      this.heeftDataToegangNieuwLidNummer(currentUser);
      const LIDNR = await this.ledenService.NieuwLidNummer(queryParams.JAAR);
      return {LIDNR};
   }

   @Post("UploadAvatar")
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiOperation({summary: 'Upload een avatar-afbeelding voor een lid.'})
   @ApiResponse({status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({status: HttpStatus.NOT_FOUND, description: 'Lid niet gevonden.'})
   @ApiResponse({status: HttpStatus.UNPROCESSABLE_ENTITY, description: 'Onjuiste bestandsextensie.'})
   @ApiResponse({status: HttpStatus.OK, description: 'Avatar geupload, geeft de URL terug.', type: String})
   async UploadAvatar(
      @CurrentUser() currentUser: RefLid,
      @Req() request: Request,
      @Body() data: UploadAvatarRequest): Promise<string>
   {
      this.logger.verbose(`LedenController.UploadAvatar(${safeStringify({currentUser, id: data?.ID})})`);
      bodyHeeftData(data);
      this.heeftDataToegangUploadAvatar(currentUser, data.ID);

      const baseUrl = `${request.protocol}://${request.get('host')}`;
      return await this.ledenService.UploadAvatar(data.ID, data.FILE, baseUrl, currentUser.ID);
   }

   // gedeelde verwerking van AddObject en UpdateObject - zie RequestToRecord() in class.Leden.inc.php.
   // Bewust een ALLOWLIST (in plaats van de vorige denylist-aanpak die enkel NAAM/VERWIJDERD/LAATSTE_AANPASSING/ID
   // uitsloot): elk veld staat achter dezelfde rolcontrole als in PHP, zodat een lid nooit velden als
   // BEHEERDER, CIMT, TEGOED of LIDTYPE_ID op zichzelf kan zetten via een gewone AddObject/UpdateObject aanroep.
   // LIDTYPE_ID, STATUSTYPE_ID, ZUSTERCLUB_ID, BUDDY_ID en BUDDY_ID2 hoeven niet omgezet te worden naar
   // relatie-connects: met het Unchecked Prisma inputtype zijn dit al platte, nullable kolommen, dus een
   // meegegeven null zet de relatie direct los (zowel bij create als update) zonder aparte afhandeling
   private async normaliserenData(
      data: CreateRefLidDto | UpdateRefLidDto,
      naamAltijdOpbouwen: boolean,
      currentUser: RefLid,
      ikBenHetZelf: boolean,
      dbLid?: RefLid): Promise<Prisma.RefLidUncheckedCreateInput | Prisma.RefLidUncheckedUpdateInput>
   {
      const isBeheerder = this.permissieService.isBeheerder(currentUser);
      const isBeheerderDDWV = this.permissieService.isBeheerderDDWV(currentUser);
      const isCIMT = this.permissieService.isCIMT(currentUser);
      const isRooster = this.permissieService.isRooster(currentUser);

      const result: Record<string, unknown> = {};
      const ruweData = data as Record<string, unknown>;
      const zet = (veld: string) =>
      {
         if (Object.prototype.hasOwnProperty.call(ruweData, veld))
            result[veld] = ruweData[veld];
      };

      // beheerder of beheerder DDWV
      if (isBeheerder || isBeheerderDDWV)
      {
         zet('DDWV_CREW');
         zet('ZUSTERCLUB_ID');
         zet('LIDTYPE_ID');
         zet('INLOGNAAM');
      }

      // beheerder of roostermaker
      if (isBeheerder || isRooster)
      {
         zet('LIERIST');
         zet('LIERIST_IO');
         zet('STARTLEIDER');
         zet('SLEEPVLIEGER');
         zet('GASTENVLIEGER');
         zet('DIENSTEN');
      }

      // beheerder, roostermaker of CIMT
      if (isBeheerder || isRooster || isCIMT)
      {
         zet('OPMERKINGEN');
      }

      // beheerder of CIMT
      if (isBeheerder || isCIMT)
      {
         zet('INSTRUCTEUR');
         zet('STATUSTYPE_ID');
         zet('BUDDY_ID');
         zet('BUDDY_ID2');
      }

      // enkel beheerder
      if (isBeheerder)
      {
         zet('LIDNR');
         zet('GMAIL');
         zet('CIMT');
         zet('ROOSTER');
         zet('STARTTOREN');
         zet('DDWV_BEHEERDER');
         zet('TECHNICUS');
         zet('BEHEERDER');
         zet('RAPPORTEUR');
         zet('STARTVERBOD');
         zet('OPGEZEGD');
         zet('AVATAR');
      }

      // zelf, beheerder of beheerder DDWV
      if (ikBenHetZelf || isBeheerder || isBeheerderDDWV)
      {
         zet('TEGOED');
         zet('VOORNAAM');
         zet('TUSSENVOEGSEL');
         zet('ACHTERNAAM');
         zet('ADRES');
         zet('POSTCODE');
         zet('WOONPLAATS');
         zet('TELEFOON');
         zet('MOBIEL');
         zet('NOODNUMMER');
         zet('EMAIL');
         zet('CLUBBLAD_POST');
         zet('ZELFSTART_ABONNEMENT');
         zet('GEBOORTE_DATUM');
         zet('MEDICAL');
         zet('SLEUTEL1');
         zet('SLEUTEL2');
         zet('BEROEP');
         zet('KNVVL_LIDNUMMER');
         zet('BREVET_NUMMER');
         zet('PRIVACY');
         zet('WACHTWOORD');

         // een expliciet meegegeven NAAM wint altijd; anders bouw 'm op uit voornaam, tussenvoegsel en
         // achternaam - zie RequestToRecord() in class.Leden.inc.php. Bij een update wordt enkel opgebouwd
         // als er daadwerkelijk nieuwe naamgegevens zijn meegegeven, anders blijft de bestaande NAAM ongewijzigd
         const expliciteNaam = data.NAAM as string | null | undefined;
         const voornaam = data.VOORNAAM as string | null | undefined;
         const achternaam = data.ACHTERNAAM as string | null | undefined;
         if (typeof expliciteNaam === "string" && expliciteNaam.trim().length > 0)
         {
            result.NAAM = expliciteNaam;
         }
         else if (naamAltijdOpbouwen || (typeof voornaam === "string" && typeof achternaam === "string"))
         {
            result.NAAM = [voornaam, data.TUSSENVOEGSEL, achternaam]
               .map(deel => (deel ?? "").toString().trim())
               .filter(deel => deel.length > 0)
               .join(" ");
         }

         // wachtwoord moet minimaal 5 tekens zijn, anders geweigerd; een leeg wachtwoord betekent
         // "niet wijzigen" - zie RequestToRecord() in class.Leden.inc.php
         if (result.WACHTWOORD)
         {
            const wachtwoord = result.WACHTWOORD as string;
            if (wachtwoord.length <= 4)
               throw new HttpException(`Wachtwoord voldoet niet`, HttpStatus.BAD_REQUEST);
            result.WACHTWOORD = await hash(wachtwoord, 10);
         }
         else
         {
            delete result.WACHTWOORD;
         }

         // zorg dat de datums omgezet worden in ISO 8601 formaat
         result.MEDICAL = parseDateOnly(result.MEDICAL as Date | string | null);
         result.GEBOORTE_DATUM = parseDateOnly(result.GEBOORTE_DATUM as Date | string | null);

         // AUTH (2FA) kan niet uitgezet worden voor bijzondere rollen - zie specialeRol()/RequestToRecord()
         // in class.Leden.inc.php. Onbekend (noch in deze aanvraag, noch in de database) betekent hier
         // "aannemen dat het speciaal is" (PHP: "we nemen geen risico")
         const isSpeciaal = ['CIMT', 'INSTRUCTEUR', 'BEHEERDER', 'DDWV_BEHEERDER', 'DDWV_CREW', 'STARTTOREN', 'ROOSTER', 'RAPPORTEUR']
            .some(veld => this.isSpecialeRol(result, dbLid, veld));
         if (isSpeciaal)
            result.AUTH = true;
         else
            zet('AUTH');

         // daginfo e-mail enkel voor CIMT, instructeur of beheerder
         const magEmailDaginfo = ['CIMT', 'INSTRUCTEUR', 'BEHEERDER']
            .some(veld => this.isSpecialeRol(result, dbLid, veld));
         if (!magEmailDaginfo)
            result.EMAIL_DAGINFO = false;
         else
            zet('EMAIL_DAGINFO');
      }

      return result as Prisma.RefLidUncheckedCreateInput | Prisma.RefLidUncheckedUpdateInput;
   }

   // bepaalt of een rol-veld "aan" staat: kijkt eerst naar de nieuwe waarde in deze aanvraag, anders naar
   // de bestaande databasewaarde, en neemt bij volledige onbekendheid aan van wel - zie specialeRol() in
   // class.Leden.inc.php
   private isSpecialeRol(result: Record<string, unknown>, dbLid: RefLid | undefined, veld: string): boolean
   {
      if (Object.prototype.hasOwnProperty.call(result, veld))
         return result[veld] === true;
      if (dbLid && Object.prototype.hasOwnProperty.call(dbLid, veld))
         return (dbLid as unknown as Record<string, unknown>)[veld] === true;
      return true;
   }

   // controleer of de gebruiker toegang heeft tot de data van Leden/GetObject
   private heeftDataToegangGetObject(_currentUser: RefLid): void
   {
      // TODO: PHP vereist hier heeftDataToegang() of zelf, zie GetObject() in class.Leden.inc.php
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Leden/GetObjects
   private heeftDataToegangGetObjects(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Leden/AddObject
   private heeftDataToegangAddObject(_currentUser: RefLid): void
   {
      // TODO: PHP vereist hier heeftDataToegang() || isBeheerderDDWV(), zie AddObject() in class.Leden.inc.php
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Leden/UpdateObject
   private heeftDataToegangUpdateObject(currentUser: RefLid, id: number): void
   {
      // zie UpdateObject() in class.Leden.inc.php: zelf, beheerder, beheerder DDWV, CIMT of roostermaker
      if (currentUser.ID !== id
         && !this.permissieService.isBeheerder(currentUser)
         && !this.permissieService.isBeheerderDDWV(currentUser)
         && !this.permissieService.isCIMT(currentUser)
         && !this.permissieService.isRooster(currentUser))
         throw new HttpException(`Niet toegestaan om ander lid te wijzigen`, HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Leden/DeleteObject
   private heeftDataToegangDeleteObject(_currentUser: RefLid): void
   {
      // TODO: PHP vereist hier heeftDataToegang() || isBeheerderDDWV(), zie VerwijderObject() in class.Leden.inc.php
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Leden/RemoveObject
   private heeftDataToegangRemoveObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Leden/RestoreObject
   private heeftDataToegangRestoreObject(_currentUser: RefLid): void
   {
      // TODO: PHP vereist hier heeftDataToegang() || isBeheerderDDWV(), zie HerstelObject() in class.Leden.inc.php
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Leden/GetVerjaardagen
   private heeftDataToegangGetVerjaardagen(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Leden/NieuwLidNummer
   private heeftDataToegangNieuwLidNummer(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Leden/UploadAvatar
   private heeftDataToegangUploadAvatar(currentUser: RefLid, id: number): void
   {
      // zie UploadAvatar() in class.Leden.inc.php: zelf, of heeftDataToegang()||isBeheerderDDWV()
      // TODO: isBeheerder is hier een benadering van heeftDataToegang()
      if (currentUser.ID !== id
         && !this.permissieService.isBeheerder(currentUser)
         && !this.permissieService.isBeheerderDDWV(currentUser))
         throw new HttpException(`Niet toegestaan om avatar van ander lid te uploaden`, HttpStatus.UNAUTHORIZED);
   }
}
