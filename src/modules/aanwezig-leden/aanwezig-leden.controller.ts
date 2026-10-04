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
import {parseDateOnly, parseTimeOnly, toDateOnly, toTimeOnly} from "../../core/helpers/TimeDate";
import {AanmeldenRequest} from "./AanmeldenRequest";
import {AfmeldenRequest} from "./AfmeldenRequest";
import {AanwezigLedenSamenvattingResponse} from "./AanwezigLedenSamenvattingResponse";
import {StartlijstService} from "../startlijst/startlijst.service";
import {LidType} from "../../core/enums/LidType";

@Controller('AanwezigLeden')
@ApiTags('AanwezigLeden')
export class AanwezigLedenController  extends HeliosController
{
   private readonly logger = new Logger(AanwezigLedenController.name);

   constructor(private readonly AanwezigLedenService: AanwezigLedenService,
               private readonly startlijstService: StartlijstService,
               private readonly permissieService:PermissieService)
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

      if (this.permissieService.isBeheerder(currentUser) || this.permissieService.isInstructeur(currentUser) || this.permissieService.isCIMT(currentUser))
      {
         const barometers = await this.startlijstService.GetStatusBarometers(objs.dataset);
         objs.dataset = objs.dataset.map(obj => ({...obj, STATUS_BAROMETER: barometers.get(obj.LID_ID)}));
      }

      objs.dataset = this.PrivacyMask(currentUser, objs.dataset);
      return objs;
   }

   @HeliosCreateObject(CreateOperAanwezigLidDto, OperAanwezigLidDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperAanwezigLidDto): Promise<OperAanwezigLidDto>
   {
      this.logger.verbose(`AanwezigLedenController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'AanwezigLeden.AddObject');
      this.heeftDataToegangAddObject(currentUser);

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
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`AanwezigLedenController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigLeden.UpdateObject');
      this.heeftDataToegangUpdateObject(currentUser);

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
      this.heeftDataToegangDeleteObject(currentUser);

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
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'AanwezigLeden.Aanmelden');
      this.heeftDataToegangAanmelden(currentUser);

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
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'AanwezigLeden.Afmelden');
      this.heeftDataToegangAfmelden(currentUser);

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
   private heeftDataToegangAddObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van AanwezigLeden/UpdateObject
   private heeftDataToegangUpdateObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van AanwezigLeden/DeleteObject
   private heeftDataToegangDeleteObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
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
   private heeftDataToegangAanmelden(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van AanwezigLeden/Afmelden
   private heeftDataToegangAfmelden(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van AanwezigLeden/Samenvatting
   private heeftDataToegangSamenvatting(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }
}
