import {Body, Controller, Get, HttpException, HttpStatus, Logger, Post, Query, UseGuards} from '@nestjs/common';
import {AanwezigLedenService} from "./aanwezig-leden.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperAanwezigLidDto} from "../../generated/nestjs-dto/operAanwezigLid.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperAanwezigLedenResponse} from "./GetObjectsOperAanwezigLedenResponse";
import {GetObjectsOperAanwezigLedenRequest} from "./GetObjectsOperAanwezigLedenRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperAanwezigLidDto} from "../../generated/nestjs-dto/create-operAanwezigLid.dto";
import {UpdateOperAanwezigLidDto} from "../../generated/nestjs-dto/update-operAanwezigLid.dto";
import {ApiBasicAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags, getSchemaPath} from "@nestjs/swagger";
import {AuthGuard} from "@nestjs/passport";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {DatumZonderTijd, parseDateOnly, parseTimeOnly, toDateOnly, toTimeOnly} from "../../core/helpers/TimeDate";
import {RoosterService} from "../rooster/rooster.service";
import {DienstenService} from "../diensten/diensten.service";
import {AanmeldenRequest} from "./AanmeldenRequest";
import {AfmeldenRequest} from "./AfmeldenRequest";
import {AanwezigLedenSamenvattingResponse} from "./AanwezigLedenSamenvattingResponse";
import {LidType} from "../../core/enums/LidType";

@Controller('AanwezigLeden')
@ApiTags('AanwezigLeden')
export class AanwezigLedenController  extends HeliosController
{
   private readonly logger = new Logger(AanwezigLedenController.name);

   constructor(private readonly AanwezigLedenService: AanwezigLedenService,
               private readonly permissieService:PermissieService,
               private readonly roosterService: RoosterService,
               private readonly dienstenService: DienstenService)
   {
      super()
   }

   @HeliosGetObject(OperAanwezigLidDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperAanwezigLidDto>
   {
      this.logger.verbose(`AanwezigLedenController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigLeden.GetObject');
      this.heeftDataToegangGetObject(currentUser);
      const obj = await this.AanwezigLedenService.GetObject(id);
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         AANKOMST: toTimeOnly(obj.AANKOMST) as unknown as Date,
         VERTREK: toTimeOnly(obj.VERTREK) as unknown as Date,
      };
   }

   @HeliosGetObjects(GetObjectsOperAanwezigLedenResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperAanwezigLedenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperAanwezigLedenResponse>>
   {
      this.logger.verbose(`AanwezigLedenController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigLeden.GetObjects');
      this.heeftDataToegangGetObjects(currentUser);
      const objs = await this.AanwezigLedenService.GetObjects(queryParams);
      objs.dataset = this.PrivacyMask(currentUser, objs.dataset);
      return objs;
   }

   @HeliosCreateObject(CreateOperAanwezigLidDto, OperAanwezigLidDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperAanwezigLidDto): Promise<OperAanwezigLidDto>
   {
      this.logger.verbose(`AanwezigLedenController.AddObject(${safeStringify({currentUser, data})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigLeden.AddObject');
      await this.heeftDataToegangAddObject(currentUser, data);
      bodyHeeftData(data);

      // DATUM en LID_ID zijn verplicht
      if (data.DATUM === undefined)
         throw new HttpException("Datum is verplicht", HttpStatus.BAD_REQUEST);
      if (data.LID_ID === undefined)
         throw new HttpException("LidID is verplicht", HttpStatus.BAD_REQUEST);

      const insert = await this.normaliserenData(data) as CreateOperAanwezigLidDto;
      const obj = await this.AanwezigLedenService.AddObject(insert, currentUser.ID);
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         AANKOMST: toTimeOnly(obj.AANKOMST) as unknown as Date,
         VERTREK: toTimeOnly(obj.VERTREK) as unknown as Date,
      };
   }

   @HeliosUpdateObject(UpdateOperAanwezigLidDto, OperAanwezigLidDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperAanwezigLidDto): Promise<OperAanwezigLidDto>
   {
      id = id ?? data.ID;
      this.logger.verbose(`AanwezigLedenController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigLeden.UpdateObject');
      await this.heeftDataToegangUpdateObject(currentUser, id, data);
      bodyHeeftData(data);

      const update = await this.normaliserenData(data) as UpdateOperAanwezigLidDto;
      const obj = await this.AanwezigLedenService.UpdateObject(id, update, currentUser.ID);
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         AANKOMST: toTimeOnly(obj.AANKOMST) as unknown as Date,
         VERTREK: toTimeOnly(obj.VERTREK) as unknown as Date,
      };
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`AanwezigLedenController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigLeden.DeleteObject');
      await this.heeftDataToegangDeleteObject(currentUser, id);

      const data: Prisma.OperAanwezigLidUncheckedUpdateInput = {
         VERWIJDERD: true
      }
      await this.AanwezigLedenService.UpdateObject(id, data, currentUser.ID);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`AanwezigLedenController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigLeden.RemoveObject');
      this.heeftDataToegangRemoveObject(currentUser);
      await this.AanwezigLedenService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`AanwezigLedenController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigLeden.RestoreObject');
      this.heeftDataToegangRestoreObject(currentUser);

      const data: Prisma.OperAanwezigLidUncheckedUpdateInput = {
         VERWIJDERD: false
      }
      await this.AanwezigLedenService.UpdateObject(id, data, currentUser.ID);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

   @Post("Aanmelden")
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiExtraModels(OperAanwezigLidDto)
   @ApiOperation({summary: 'Aanmelden van een lid als aanwezig. Maakt een nieuw record aan, of past de bestaande aanmelding van dat lid op die dag aan.'})
   @ApiResponse({status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({status: HttpStatus.NOT_ACCEPTABLE, description: 'LID_ID ontbreekt.'})
   @ApiResponse({status: HttpStatus.OK, description: 'Aanmelding verwerkt.', schema: {'$ref': getSchemaPath(OperAanwezigLidDto)}})
   async Aanmelden(
      @CurrentUser() currentUser: RefLid,
      @Body() data: AanmeldenRequest): Promise<OperAanwezigLidDto>
   {
      this.logger.verbose(`AanwezigLedenController.Aanmelden(${safeStringify({currentUser, data})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigLeden.Aanmelden');
      await this.heeftDataToegangAanmelden(currentUser, data);
      bodyHeeftData(data);

      const obj = await this.AanwezigLedenService.Aanmelden(data, currentUser.ID);
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         AANKOMST: toTimeOnly(obj.AANKOMST) as unknown as Date,
         VERTREK: toTimeOnly(obj.VERTREK) as unknown as Date,
      };
   }

   @Post("Afmelden")
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiExtraModels(OperAanwezigLidDto)
   @ApiOperation({summary: 'Afmelden van een aangemeld lid.'})
   @ApiResponse({status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({status: HttpStatus.NOT_ACCEPTABLE, description: 'LID_ID ontbreekt.'})
   @ApiResponse({status: HttpStatus.CONFLICT, description: 'Lid is niet aangemeld.'})
   @ApiResponse({status: HttpStatus.OK, description: 'Afmelding verwerkt.', schema: {'$ref': getSchemaPath(OperAanwezigLidDto)}})
   async Afmelden(
      @CurrentUser() currentUser: RefLid,
      @Body() data: AfmeldenRequest): Promise<OperAanwezigLidDto>
   {
      this.logger.verbose(`AanwezigLedenController.Afmelden(${safeStringify({currentUser, data})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigLeden.Afmelden');
      await this.heeftDataToegangAfmelden(currentUser, data);
      bodyHeeftData(data);

      const obj = await this.AanwezigLedenService.Afmelden(data, currentUser.ID);
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         AANKOMST: toTimeOnly(obj.AANKOMST) as unknown as Date,
         VERTREK: toTimeOnly(obj.VERTREK) as unknown as Date,
      };
   }

   @Get("Samenvatting")
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiExtraModels(AanwezigLedenSamenvattingResponse)
   @ApiOperation({summary: 'Samenvatting van de aanmeldingen van een vliegdag.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({status: HttpStatus.OK, description: 'Samenvatting opgehaald.', schema: {'$ref': getSchemaPath(AanwezigLedenSamenvattingResponse)}})
   async Samenvatting(
      @CurrentUser() currentUser: RefLid,
      @Query('DATUM') datum?: string): Promise<AanwezigLedenSamenvattingResponse>
   {
      this.logger.verbose(`AanwezigLedenController.Samenvatting(${safeStringify({currentUser, datum})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigLeden.Samenvatting');
      this.heeftDataToegangSamenvatting(currentUser);

      const gevraagdeDatum = datum ? parseDateOnly(datum) as Date : parseDateOnly(new Date().toISOString().slice(0, 10)) as Date;
      return await this.AanwezigLedenService.Samenvatting(gevraagdeDatum);
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden en normaliseert
   // de datum- en tijdvelden
   private async normaliserenData(
      data: CreateOperAanwezigLidDto | UpdateOperAanwezigLidDto): Promise<CreateOperAanwezigLidDto | UpdateOperAanwezigLidDto>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      data.DATUM = parseDateOnly(data.DATUM as Date | string) as Date;
      data.AANKOMST = parseTimeOnly(data.AANKOMST as Date | string | null);
      data.VERTREK = parseTimeOnly(data.VERTREK as Date | string | null);

      return data;
   }

   // een DDWV-lid mag andere DDWV-leden (LIDTYPE_ID = LidType.DDWV) wel herkennen, maar geen persoonsgegevens
   // van de overige (niet-DDWV) leden zien - vergelijkbaar met privacyMask() in de PHP implementatie
   private PrivacyMask(currentUser: RefLid, dataset: GetObjectsOperAanwezigLedenResponse[]): GetObjectsOperAanwezigLedenResponse[]
   {
      // de vliegcurrency (STATUS_BAROMETER) is enkel zichtbaar voor beheerder, instructeur en CIMT
      if (!this.permissieService.isBeheerder(currentUser) && !this.permissieService.isInstructeur(currentUser) && !this.permissieService.isCIMT(currentUser))
      {
         dataset = dataset.map(aanmelding =>
         {
            const result = {...aanmelding};
            delete result.STATUS_BAROMETER;
            return result;
         });
      }

      if (currentUser.LIDTYPE_ID !== LidType.DDWV)
         return dataset;

      const MASK = "***";
      return dataset.map(aanmelding =>
      {
         if (aanmelding.LIDTYPE_ID === LidType.DDWV)
            return aanmelding;

         return {
            ...aanmelding,
            NAAM: MASK,
            VOORNAAM: MASK,
            TUSSENVOEGSEL: MASK,
            ACHTERNAAM: MASK,
            ADRES: MASK,
            POSTCODE: MASK,
            WOONPLAATS: MASK,
            LIDNR: MASK,
            MOBIEL: MASK,
            EMAIL: MASK,
            NOODNUMMER: MASK,
            TELEFOON: MASK,
            INLOGNAAM: MASK,
            AVATAR: MASK,
         };
      });
   }

   // controleer of de gebruiker toegang heeft tot de data van AanwezigLeden/GetObject
   private heeftDataToegangGetObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van AanwezigLeden/GetObjects
   private heeftDataToegangGetObjects(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van AanwezigLeden/AddObject
   // alleen een eigen aanmelding, tenzij volledige toegang op die datum - zie AddObject() in class.AanwezigLeden.inc.php
   private async heeftDataToegangAddObject(currentUser: RefLid, data: CreateOperAanwezigLidDto): Promise<void>
   {
      // ontbrekende DATUM / LID_ID wordt verderop in AddObject met een 400 afgevangen
      if (data.LID_ID === undefined || data.DATUM === undefined)
         return;

      await this.controleerEigenAanmelding(currentUser, data.LID_ID, parseDateOnly(data.DATUM as Date | string) as Date);
   }

   // controleer of de gebruiker toegang heeft tot de data van AanwezigLeden/UpdateObject
   // alleen de eigen aanmelding, tenzij volledige toegang op die datum - zie UpdateObject() in class.AanwezigLeden.inc.php
   private async heeftDataToegangUpdateObject(currentUser: RefLid, id: number, data: UpdateOperAanwezigLidDto): Promise<void>
   {
      const bestaand = await this.AanwezigLedenService.GetObject(id);
      await this.controleerEigenAanmelding(currentUser, bestaand.LID_ID, bestaand.DATUM);

      // voorkom dat een eigen aanmelding naar een ander lid of een andere datum verplaatst wordt
      const nieuwLidId = data.LID_ID ?? bestaand.LID_ID;
      const nieuweDatum = data.DATUM !== undefined ? parseDateOnly(data.DATUM as Date | string) as Date : bestaand.DATUM;
      if (nieuwLidId !== bestaand.LID_ID || nieuweDatum.getTime() !== bestaand.DATUM.getTime())
         await this.controleerEigenAanmelding(currentUser, nieuwLidId, nieuweDatum);
   }

   // controleer of de gebruiker toegang heeft tot de data van AanwezigLeden/DeleteObject
   // alleen de eigen aanmelding, tenzij volledige toegang op die datum - zie VerwijderObject() in class.AanwezigLeden.inc.php
   private async heeftDataToegangDeleteObject(currentUser: RefLid, id: number): Promise<void>
   {
      const bestaand = await this.AanwezigLedenService.GetObject(id);
      await this.controleerEigenAanmelding(currentUser, bestaand.LID_ID, bestaand.DATUM);
   }

   // controleer of de gebruiker toegang heeft tot de data van AanwezigLeden/RemoveObject
   private heeftDataToegangRemoveObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van AanwezigLeden/RestoreObject
   private heeftDataToegangRestoreObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van AanwezigLeden/Aanmelden
   // alleen zichzelf aanmelden, tenzij volledige toegang op die datum - zie Aanmelden() in class.AanwezigLeden.inc.php
   private async heeftDataToegangAanmelden(currentUser: RefLid, data: AanmeldenRequest): Promise<void>
   {
      // ontbrekende LID_ID wordt in de service met een 406 afgevangen
      if (data.LID_ID === undefined || data.LID_ID === null)
         return;

      // zelfde datumbepaling als AanwezigLedenService.Aanmelden()
      const tijdstip = data.TIJDSTIP ? new Date(data.TIJDSTIP) : new Date();
      const datum = data.DATUM ? parseDateOnly(data.DATUM) as Date : DatumZonderTijd(tijdstip);
      await this.controleerEigenAanmelding(currentUser, data.LID_ID, datum);
   }

   // controleer of de gebruiker toegang heeft tot de data van AanwezigLeden/Afmelden
   // alleen zichzelf afmelden, tenzij volledige toegang op die datum - zie Afmelden() in class.AanwezigLeden.inc.php
   private async heeftDataToegangAfmelden(currentUser: RefLid, data: AfmeldenRequest): Promise<void>
   {
      // ontbrekende LID_ID wordt in de service met een 406 afgevangen
      if (data.LID_ID === undefined || data.LID_ID === null)
         return;

      // met een ID telt het lid en de datum van dat record (niet de meegegeven LID_ID), anders de aanmelding van
      // LID_ID van vandaag - zelfde opzoeking als AanwezigLedenService.Afmelden()
      if (data.ID !== undefined && data.ID !== null)
      {
         // onbekend ID wordt in de service met een 409 afgevangen
         const bestaand = await this.AanwezigLedenService.GetObject(data.ID).catch(() => null);
         if (bestaand)
            await this.controleerEigenAanmelding(currentUser, bestaand.LID_ID, bestaand.DATUM);
         return;
      }
      await this.controleerEigenAanmelding(currentUser, data.LID_ID, DatumZonderTijd(new Date()));
   }

   // controleer of de gebruiker toegang heeft tot de data van AanwezigLeden/Samenvatting
   private heeftDataToegangSamenvatting(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // een aanmelding van een ander lid mag alleen met volledige toegang op die datum
   private async controleerEigenAanmelding(currentUser: RefLid, lidId: number, datum: Date): Promise<void>
   {
      if (lidId === currentUser.ID)
         return;

      if (!(await this.heeftVolleToegangOpDatum(currentUser, datum)))
         throw new HttpException("Geen schrijfrechten", HttpStatus.UNAUTHORIZED);
   }

   // volledige toegang tot de aanmeldingen van een datum, zie heeftDataToegang($datum) in include/helios.php: beheerder,
   // instructeur of CIMT altijd, starttoren alleen vandaag, beheerder DDWV op DDWV dagen en DDWV crew op DDWV dagen
   // waarop hij/zij zelf dienst heeft
   private async heeftVolleToegangOpDatum(currentUser: RefLid, datum: Date): Promise<boolean>
   {
      if (this.permissieService.isBeheerder(currentUser)
         || this.permissieService.isInstructeur(currentUser)
         || this.permissieService.isCIMT(currentUser))
         return true;

      if (this.permissieService.isStarttoren(currentUser))
         return datum.getTime() === DatumZonderTijd(new Date()).getTime();

      if (this.permissieService.isBeheerderDDWV(currentUser) || this.permissieService.isDDWVCrew(currentUser))
      {
         const rooster = await this.roosterService.GetObjectByDatum(datum);
         if (!rooster?.DDWV)
            return false;

         if (this.permissieService.isBeheerderDDWV(currentUser))
            return true;

         return await this.dienstenService.LidHeeftDienst(currentUser.ID, datum);
      }
      return false;
   }
}
