import {Body, Controller, Get, HttpException, HttpStatus, Logger, Query, UseGuards} from '@nestjs/common';
import {StartlijstBeperking, StartlijstService} from "./startlijst.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperStartlijstDto} from "../../generated/nestjs-dto/operStartlijst.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {OperStartlijst, Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperStartlijstResponse} from "./GetObjectsOperStartlijstResponse";
import {GetObjectsOperStartlijstRequest} from "./GetObjectsOperStartlijstRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperStartlijstDto} from "../../generated/nestjs-dto/create-operStartlijst.dto";
import {UpdateOperStartlijstDto} from "../../generated/nestjs-dto/update-operStartlijst.dto";
import {ApiBasicAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags, getSchemaPath} from "@nestjs/swagger";
import {AuthGuard} from "@nestjs/passport";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {parseDateOnly, parseTimeOnly, toDateOnly, toTimeHHmm} from "../../core/helpers/TimeDate";
import {RecencyResponse} from "./RecencyResponse";
import {GetLogboekRequest} from "./GetLogboekRequest";
import {GetLogboekResponse} from "./GetLogboekResponse";
import {GetVliegtuigLogboekRequest} from "./GetVliegtuigLogboekRequest";
import {GetVliegtuigLogboekResponse} from "./GetVliegtuigLogboekResponse";
import {GetVliegtuigLogboekTotalenRequest} from "./GetVliegtuigLogboekTotalenRequest";
import {GetVliegtuigLogboekTotalenResponse} from "./GetVliegtuigLogboekTotalenResponse";
import {VliegtuigenService} from "../vliegtuigen/vliegtuigen.service";
import {RegCall} from "../../core/helpers/RegCall";
import {RoosterService} from "../rooster/rooster.service";
import {DienstenService} from "../diensten/diensten.service";
import {DatumZonderTijd} from "../../core/helpers/TimeDate";
import {GetLogboekTotalenRequest} from "./GetLogboekTotalenRequest";
import {GetLogboekTotalenResponse} from "./GetLogboekTotalenResponse";
import {GetVliegDagenRequest} from "./GetVliegDagenRequest";
import {GetVliegDagenResponse} from "./GetVliegDagenResponse";

@Controller('Startlijst')
@ApiTags('Startlijst')
export class StartlijstController extends HeliosController
{
   private readonly logger = new Logger(StartlijstController.name);

   constructor(private readonly startlijstService: StartlijstService,
               private readonly vliegtuigenService: VliegtuigenService,
               private readonly permissieService: PermissieService,
               private readonly roosterService: RoosterService,
               private readonly dienstenService: DienstenService)
   {
      super()
   }

   @HeliosGetObject(OperStartlijstDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperStartlijstDto>
   {
      this.logger.verbose(`StartlijstController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.GetObject');
      await this.heeftDataToegangGetObject(currentUser, id);
      const obj = await this.startlijstService.GetObject(id);
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         STARTTIJD: toTimeHHmm(obj.STARTTIJD) as unknown as Date,
         LANDINGSTIJD: toTimeHHmm(obj.LANDINGSTIJD) as unknown as Date,
      };
   }

   @HeliosGetObjects(GetObjectsOperStartlijstResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperStartlijstRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperStartlijstResponse>>
   {
      this.logger.verbose(`StartlijstController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.GetObjects');
      this.heeftDataToegangGetObjects(currentUser);

      const beperking = await this.BeperkingGetObjects(currentUser);
      return await this.startlijstService.GetObjects(queryParams, beperking);
   }

   @HeliosCreateObject(CreateOperStartlijstDto, OperStartlijstDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperStartlijstDto): Promise<OperStartlijstDto>
   {
      this.logger.verbose(`StartlijstController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.AddObject');
      await this.heeftDataToegangAddObject(currentUser, data);

      const insert = await this.normaliserenData(data, currentUser) as CreateOperStartlijstDto;
      const obj = await this.startlijstService.AddObject(insert as Prisma.OperStartlijstUncheckedCreateInput, currentUser.ID);
      await this.startlijstService.AanmeldenNaOpslaan(obj, currentUser.ID, await this.heeftVolleToegangOpDatum(currentUser, obj.DATUM));
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         STARTTIJD: toTimeHHmm(obj.STARTTIJD) as unknown as Date,
         LANDINGSTIJD: toTimeHHmm(obj.LANDINGSTIJD) as unknown as Date,
      };
   }

   @HeliosUpdateObject(UpdateOperStartlijstDto, OperStartlijstDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperStartlijstDto): Promise<OperStartlijstDto>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`StartlijstController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.UpdateObject');
      await this.heeftDataToegangUpdateObject(currentUser, id, data);

      const update = await this.normaliserenData(data, currentUser) as UpdateOperStartlijstDto;
      const obj = await this.startlijstService.UpdateObject(id, update as Prisma.OperStartlijstUncheckedUpdateInput, currentUser.ID);
      await this.startlijstService.AanmeldenNaOpslaan(obj, currentUser.ID, await this.heeftVolleToegangOpDatum(currentUser, obj.DATUM));
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         STARTTIJD: toTimeHHmm(obj.STARTTIJD) as unknown as Date,
         LANDINGSTIJD: toTimeHHmm(obj.LANDINGSTIJD) as unknown as Date,
      };
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`StartlijstController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.DeleteObject');
      await this.heeftDataToegangDeleteObject(currentUser, id);

      const data: Prisma.OperStartlijstUpdateInput = {
         VERWIJDERD: true
      }
      await this.startlijstService.UpdateObject(id, data, currentUser.ID);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`StartlijstController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.RemoveObject');
      this.heeftDataToegangRemoveObject(currentUser);
      await this.startlijstService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`StartlijstController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.RestoreObject');
      await this.heeftDataToegangRestoreObject(currentUser, id);

      const data: Prisma.OperStartlijstUpdateInput = {
         VERWIJDERD: false
      }
      await this.startlijstService.UpdateObject(id, data, currentUser.ID);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

   @Get("GetRecency")
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiExtraModels(RecencyResponse)
   @ApiOperation({summary: 'Vliegcurrency-statistieken van een lid.'})
   @ApiResponse({status: HttpStatus.NOT_ACCEPTABLE, description: 'VLIEGER_ID ontbreekt.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({status: HttpStatus.OK, description: 'Recency opgehaald.', schema: {'$ref': getSchemaPath(RecencyResponse)}})
   async GetRecency(
      @CurrentUser() currentUser: RefLid,
      @Query('VLIEGER_ID') vliegerId: number,
      @Query('DATUM') datum?: string): Promise<RecencyResponse>
   {
      this.logger.verbose(`StartlijstController.GetRecency(${safeStringify({currentUser, vliegerId, datum})})`);
      if (vliegerId === undefined)
         throw new HttpException("VLIEGER_ID moet ingevuld zijn", HttpStatus.NOT_ACCEPTABLE);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.GetRecency');
      this.heeftDataToegangGetRecency(currentUser, Number(vliegerId));

      const gevraagdeDatum = datum ? parseDateOnly(datum) as Date : undefined;
      return await this.startlijstService.GetRecency(Number(vliegerId), gevraagdeDatum);
   }

   @Get("GetRecencyClubZonderInstructie")
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiExtraModels(RecencyResponse)
   @ApiOperation({summary: 'Vliegcurrency-statistieken van een lid, alleen op clubkisten en zonder gegeven instructie.'})
   @ApiResponse({status: HttpStatus.NOT_ACCEPTABLE, description: 'VLIEGER_ID ontbreekt.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({status: HttpStatus.NOT_FOUND, description: 'Lid niet gevonden.'})
   @ApiResponse({status: HttpStatus.OK, description: 'Recency opgehaald.', schema: {'$ref': getSchemaPath(RecencyResponse)}})
   async GetRecencyClubZonderInstructie(
      @CurrentUser() currentUser: RefLid,
      @Query('VLIEGER_ID') vliegerId: number,
      @Query('DATUM') datum?: string): Promise<RecencyResponse>
   {
      this.logger.verbose(`StartlijstController.GetRecencyClubZonderInstructie(${safeStringify({currentUser, vliegerId, datum})})`);
      if (vliegerId === undefined)
         throw new HttpException("VLIEGER_ID moet ingevuld zijn", HttpStatus.NOT_ACCEPTABLE);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.GetRecencyClubZonderInstructie');
      this.heeftDataToegangGetRecencyClubZonderInstructie(currentUser, Number(vliegerId));

      // zie route Startlijst/GetRecencyClubZonderInstructie: GetRecency($vliegerID, $datum, false, true)
      const gevraagdeDatum = datum ? parseDateOnly(datum) as Date : undefined;
      return await this.startlijstService.GetRecency(Number(vliegerId), gevraagdeDatum, false, true);
   }

   @Get("GetLogboek")
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiExtraModels(GetLogboekResponse)
   @ApiOperation({summary: 'Logboek van een lid, standaard het ingelogde lid.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({
      status: HttpStatus.OK, description: 'Logboek opgehaald.', schema: {
         type: 'object',
         properties: {
            dataset: {type: 'array', items: {'$ref': getSchemaPath(GetLogboekResponse)}},
            totaal: {type: 'number'},
            hash: {type: 'string'},
         }
      }
   })
   async GetLogboek(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetLogboekRequest): Promise<IHeliosGetObjectsResponse<GetLogboekResponse>>
   {
      this.logger.verbose(`StartlijstController.GetLogboek(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.GetLogboek');
      this.heeftDataToegangGetLogboek(currentUser, queryParams.LID_ID ?? currentUser.ID);

      const lidId = queryParams.LID_ID ?? currentUser.ID;
      return await this.startlijstService.GetLogboek(queryParams, lidId, this.alleenDDWVVanAnderLid(currentUser, lidId));
   }

   @Get("GetVliegtuigLogboek")
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiExtraModels(GetVliegtuigLogboekResponse)
   @ApiOperation({summary: 'Logboek van een vliegtuig: gevlogen dagen met aantal starts en vliegtijd per dag.'})
   @ApiResponse({status: HttpStatus.NOT_ACCEPTABLE, description: 'ID ontbreekt, of geen rechten om dit logboek te bekijken.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({
      status: HttpStatus.OK, description: 'Logboek opgehaald.', schema: {
         type: 'object',
         properties: {
            dataset: {type: 'array', items: {'$ref': getSchemaPath(GetVliegtuigLogboekResponse)}},
            totaal: {type: 'number'},
            hash: {type: 'string'},
         }
      }
   })
   async GetVliegtuigLogboek(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetVliegtuigLogboekRequest): Promise<IHeliosGetObjectsResponse<GetVliegtuigLogboekResponse>>
   {
      this.logger.verbose(`StartlijstController.GetVliegtuigLogboek(${safeStringify({currentUser, queryParams})})`);
      if (queryParams.ID === undefined)
         throw new HttpException("ID ontbreekt in aanroep", HttpStatus.NOT_ACCEPTABLE);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.GetVliegtuigLogboek');
      await this.heeftDataToegangGetVliegtuigLogboek(currentUser, queryParams.ID);

      const vliegtuig = await this.vliegtuigenService.GetObject(queryParams.ID);
      const regCall = RegCall(vliegtuig.REGISTRATIE, vliegtuig.CALLSIGN);
      return await this.startlijstService.GetVliegtuigLogboek(queryParams, regCall);
   }

   @Get("GetVliegtuigLogboekTotalen")
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiExtraModels(GetVliegtuigLogboekTotalenResponse)
   @ApiOperation({summary: 'Logboek-totalen per maand van een vliegtuig, voor een heel jaar (standaard het huidige jaar).'})
   @ApiResponse({status: HttpStatus.NOT_ACCEPTABLE, description: 'ID ontbreekt, of geen rechten om dit logboek te bekijken.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({status: HttpStatus.OK, description: 'Totalen opgehaald.', schema: {'$ref': getSchemaPath(GetVliegtuigLogboekTotalenResponse)}})
   async GetVliegtuigLogboekTotalen(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetVliegtuigLogboekTotalenRequest): Promise<GetVliegtuigLogboekTotalenResponse>
   {
      this.logger.verbose(`StartlijstController.GetVliegtuigLogboekTotalen(${safeStringify({currentUser, queryParams})})`);
      if (queryParams.ID === undefined)
         throw new HttpException("ID ontbreekt in aanroep", HttpStatus.NOT_ACCEPTABLE);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.GetVliegtuigLogboekTotalen');
      await this.heeftDataToegangGetVliegtuigLogboekTotalen(currentUser, queryParams.ID);

      const vliegtuig = await this.vliegtuigenService.GetObject(queryParams.ID);
      const regCall = RegCall(vliegtuig.REGISTRATIE, vliegtuig.CALLSIGN);
      return await this.startlijstService.GetVliegtuigLogboekTotalen(queryParams, regCall);
   }

   @Get("GetLogboekTotalen")
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiExtraModels(GetLogboekTotalenResponse)
   @ApiOperation({summary: 'Logboek-totalen van een lid voor een heel jaar (standaard het ingelogde lid en het huidige jaar).'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({status: HttpStatus.NOT_FOUND, description: 'Lid niet gevonden.'})
   @ApiResponse({status: HttpStatus.NOT_MODIFIED, description: 'Data is ongewijzigd.'})
   @ApiResponse({status: HttpStatus.OK, description: 'Totalen opgehaald.', schema: {'$ref': getSchemaPath(GetLogboekTotalenResponse)}})
   async GetLogboekTotalen(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetLogboekTotalenRequest): Promise<GetLogboekTotalenResponse>
   {
      this.logger.verbose(`StartlijstController.GetLogboekTotalen(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.GetLogboekTotalen');
      this.heeftDataToegangGetLogboekTotalen(currentUser, queryParams.LID_ID ?? currentUser.ID);

      const lidId = queryParams.LID_ID ?? currentUser.ID;
      return await this.startlijstService.GetLogboekTotalen(queryParams, lidId, this.alleenDDWVVanAnderLid(currentUser, lidId));
   }

   @Get("GetVliegDagen")
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiExtraModels(GetVliegDagenResponse)
   @ApiOperation({summary: 'Vliegdagen met per dag het aantal starts en de totale vliegtijd (standaard het huidige jaar).'})
   @ApiResponse({status: HttpStatus.BAD_REQUEST, description: 'SORT is onjuist.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({status: HttpStatus.NOT_MODIFIED, description: 'Data is ongewijzigd.'})
   @ApiResponse({
      status: HttpStatus.OK, description: 'Vliegdagen opgehaald.', schema: {
         type: 'object',
         properties: {
            dataset: {type: 'array', items: {'$ref': getSchemaPath(GetVliegDagenResponse)}},
            totaal: {type: 'number'},
            hash: {type: 'string'},
         }
      }
   })
   async GetVliegDagen(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetVliegDagenRequest): Promise<IHeliosGetObjectsResponse<GetVliegDagenResponse>>
   {
      this.logger.verbose(`StartlijstController.GetVliegDagen(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.GetVliegDagen');
      this.heeftDataToegangGetVliegDagen(currentUser);

      const beperking = await this.BeperkingGetVliegDagen(currentUser);
      return await this.startlijstService.GetVliegDagen(queryParams, beperking);
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden en normaliseert
   // de datumvelden (DATUM, STARTTIJD, LANDINGSTIJD)
   private async normaliserenData(
      data: CreateOperStartlijstDto | UpdateOperStartlijstDto,
      currentUser: RefLid): Promise<CreateOperStartlijstDto | UpdateOperStartlijstDto>
   {
      // CHECKSTART mag alleen door beheerder, CIMT of instructeur gezet worden, voor anderen wordt het genegeerd -
      // zie RequestToRecord() in class.Startlijst.inc.php
      if (!this.permissieService.isBeheerder(currentUser)
         && !this.permissieService.isCIMT(currentUser)
         && !this.permissieService.isInstructeur(currentUser))
         delete data.CHECKSTART;

      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert
      // de DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      // DATUM is optioneel op de update-DTO maar verplicht op de create-DTO: cast om deze union-brede
      // toewijzing toe te staan
      (data as Pick<CreateOperStartlijstDto, "DATUM">).DATUM = parseDateOnly(data.DATUM as Date | string) as Date;
      data.STARTTIJD = parseTimeOnly(data.STARTTIJD as Date | string | null);
      data.LANDINGSTIJD = parseTimeOnly(data.LANDINGSTIJD as Date | string | null);

      return data;
   }

   // privacy-check gedeeld door GetVliegtuigLogboek en GetVliegtuigLogboekTotalen, zie beide functies in
   // class.Startlijst.inc.php: beheerder-achtige rollen en clubkisten mag iedereen bekijken, voor een
   // privékist moet de gebruiker er zelf recent (afgelopen 6 maanden) op gevlogen zijn
   private async controleerVliegtuigLogboekToegang(currentUser: RefLid, vliegtuigId: number): Promise<void>
   {
      const vliegtuig = await this.vliegtuigenService.GetObject(vliegtuigId);
      const heeftVrijeToegang =
         this.permissieService.isBeheerder(currentUser) ||
         this.permissieService.isBeheerderDDWV(currentUser) ||
         this.permissieService.isStarttoren(currentUser) ||
         this.permissieService.isRapporteur(currentUser) ||
         this.permissieService.isInstructeur(currentUser) ||
         vliegtuig.CLUBKIST;

      if (!heeftVrijeToegang && !(await this.startlijstService.HeeftRecentGevlogen(currentUser.ID, vliegtuigId)))
         throw new HttpException("Niet gemachtigd om logboek te bekijken", HttpStatus.NOT_ACCEPTABLE);
   }

   // volledige toegang tot alle startlijst data, zie heeftDataToegang() zonder datum in include/helios.php
   private heeftVolleToegang(currentUser: RefLid): boolean
   {
      return this.permissieService.isBeheerder(currentUser)
         || this.permissieService.isInstructeur(currentUser)
         || this.permissieService.isCIMT(currentUser);
   }

   // volledige toegang tot de startlijst van een datum, zie heeftDataToegang($datum) in include/helios.php: beheerder,
   // instructeur of CIMT altijd, starttoren alleen vandaag, beheerder DDWV op DDWV dagen en DDWV crew op DDWV dagen
   // waarop hij/zij zelf dienst heeft
   private async heeftVolleToegangOpDatum(currentUser: RefLid, datum: Date): Promise<boolean>
   {
      if (this.heeftVolleToegang(currentUser))
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

   // zonder volledige toegang op de datum van de start mag alleen de eigen start (als vlieger of inzittende)
   // gelezen of aangepast worden
   private async controleerEigenStart(currentUser: RefLid, start: OperStartlijst, melding: string): Promise<void>
   {
      if (await this.heeftVolleToegangOpDatum(currentUser, start.DATUM))
         return;

      if (start.VLIEGER_ID !== currentUser.ID && start.INZITTENDE_ID !== currentUser.ID)
         throw new HttpException(melding, HttpStatus.UNAUTHORIZED);
   }

   // de logboek(totalen) van een ander lid mogen alleen met volledige toegang, als rapporteur, of als beheerder DDWV
   // (die ziet dan alleen de DDWV vluchten, zie alleenDDWVVanAnderLid())
   private controleerLogboekToegang(currentUser: RefLid, lidId: number): void
   {
      if (lidId === currentUser.ID || this.heeftVolleToegang(currentUser) || this.permissieService.isRapporteur(currentUser))
         return;

      if (!this.permissieService.isBeheerderDDWV(currentUser))
         throw new HttpException("Gebruiker mag geen logboek van ander lid opvragen", HttpStatus.UNAUTHORIZED);
   }

   // een beheerder DDWV (zonder andere rechten) ziet van een ander lid alleen de vluchten op DDWV dagen, zie
   // GetLogboek() / GetLogboekTotalen() in class.Startlijst.inc.php
   private alleenDDWVVanAnderLid(currentUser: RefLid, lidId: number): boolean
   {
      return lidId !== currentUser.ID
         && !this.heeftVolleToegang(currentUser)
         && !this.permissieService.isRapporteur(currentUser)
         && this.permissieService.isBeheerderDDWV(currentUser);
   }

   // PHP geeft voor GetObjects() geen 401, maar beperkt de dataset: zonder volledige toegang, starttoren of rapporteur
   // alleen de eigen vluchten, voor beheerder DDWV en DDWV crew aangevuld met alle vluchten op DDWV dagen. De
   // starttoren ziet altijd alleen vandaag. Zie GetObjects() in class.Startlijst.inc.php
   private async BeperkingGetObjects(currentUser: RefLid): Promise<StartlijstBeperking>
   {
      const beperking: StartlijstBeperking = {};
      if (!this.heeftVolleToegang(currentUser)
         && !this.permissieService.isStarttoren(currentUser)
         && !this.permissieService.isRapporteur(currentUser))
      {
         beperking.LID_ID = currentUser.ID;
         if (this.permissieService.isBeheerderDDWV(currentUser) || this.permissieService.isDDWVCrew(currentUser))
            beperking.DATUMS = await this.startlijstService.DDWVDatums();
      }

      if (this.permissieService.isStarttoren(currentUser))
         beperking.DATUM = DatumZonderTijd(new Date());

      return beperking;
   }

   // PHP geeft voor GetVliegDagen() geen 401, maar beperkt de dataset: zonder volledige toegang of rapporteur alleen
   // de dagen met eigen vluchten, voor beheerder DDWV aangevuld met de DDWV dagen en voor DDWV crew met de DDWV dagen
   // waarop hij/zij dienst had. De starttoren ziet dan alleen vandaag. Zie GetVliegDagen() in class.Startlijst.inc.php
   private async BeperkingGetVliegDagen(currentUser: RefLid): Promise<StartlijstBeperking>
   {
      const beperking: StartlijstBeperking = {};
      if (this.heeftVolleToegang(currentUser) || this.permissieService.isRapporteur(currentUser))
         return beperking;

      beperking.LID_ID = currentUser.ID;
      beperking.DATUMS = [];
      if (this.permissieService.isBeheerderDDWV(currentUser) || this.permissieService.isDDWVCrew(currentUser))
      {
         const ddwvDatums = await this.startlijstService.DDWVDatums();
         if (this.permissieService.isBeheerderDDWV(currentUser))
            beperking.DATUMS.push(...ddwvDatums);

         if (this.permissieService.isDDWVCrew(currentUser))
         {
            const ddwvDagen = new Set(ddwvDatums.map(datum => datum.getTime()));
            const dienstDatums = await this.dienstenService.LidDienstDatums(currentUser.ID);
            beperking.DATUMS.push(...dienstDatums.filter(datum => ddwvDagen.has(datum.getTime())));
         }
      }

      if (this.permissieService.isStarttoren(currentUser))
         beperking.DATUM = DatumZonderTijd(new Date());

      return beperking;
   }

   // controleer of de gebruiker toegang heeft tot de data van Startlijst/GetObject
   private async heeftDataToegangGetObject(currentUser: RefLid, id: number): Promise<void>
   {
      // zie GetObject() in class.Startlijst.inc.php
      const start = await this.startlijstService.GetObject(id);
      await this.controleerEigenStart(currentUser, start, "Geen leesrechten voor dit record");
   }

   // controleer of de gebruiker toegang heeft tot de data van Startlijst/GetObjects
   private heeftDataToegangGetObjects(_currentUser: RefLid): void
   {
      // PHP geeft hier geen 401, de dataset wordt beperkt, zie BeperkingGetObjects()
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Startlijst/AddObject
   private async heeftDataToegangAddObject(currentUser: RefLid, data: CreateOperStartlijstDto): Promise<void>
   {
      // zonder volledige toegang op die datum mogen alleen vluchten voor jezelf ingevoerd worden, zie AddObject() in
      // class.Startlijst.inc.php
      const datum = parseDateOnly(data.DATUM as Date | string) as Date;
      if (await this.heeftVolleToegangOpDatum(currentUser, datum))
         return;

      if (data.VLIEGER_ID !== currentUser.ID && data.INZITTENDE_ID !== currentUser.ID)
         throw new HttpException(`VLIEGER_ID of INZITTENDE_ID moet LID_ID(${currentUser.ID}) bevatten`, HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Startlijst/UpdateObject
   private async heeftDataToegangUpdateObject(currentUser: RefLid, id: number, data: UpdateOperStartlijstDto): Promise<void>
   {
      // zie UpdateObject() in class.Startlijst.inc.php: zonder volledige toegang op de datum van de bestaande start
      // mag alleen de eigen start aangepast worden, en mag je jezelf er niet af halen
      const bestaand = await this.startlijstService.GetObject(id);
      if (!(await this.heeftVolleToegangOpDatum(currentUser, bestaand.DATUM)))
      {
         if (bestaand.VLIEGER_ID !== currentUser.ID && bestaand.INZITTENDE_ID !== currentUser.ID)
            throw new HttpException("Geen schrijfrechten", HttpStatus.UNAUTHORIZED);

         const nieuweVlieger = data.VLIEGER_ID !== undefined ? data.VLIEGER_ID : bestaand.VLIEGER_ID;
         const nieuweInzittende = data.INZITTENDE_ID !== undefined ? data.INZITTENDE_ID : bestaand.INZITTENDE_ID;
         if (nieuweVlieger !== currentUser.ID && nieuweInzittende !== currentUser.ID)
            throw new HttpException(`VLIEGER_ID of INZITTENDE_ID moet LID_ID(${currentUser.ID}) bevatten`, HttpStatus.UNAUTHORIZED);
      }

      // de starttoren mag alleen vluchten van vandaag invoeren
      if (this.permissieService.isStarttoren(currentUser) && data.DATUM !== undefined)
      {
         const nieuweDatum = parseDateOnly(data.DATUM as Date | string) as Date;
         if (nieuweDatum.getTime() !== DatumZonderTijd(new Date()).getTime())
            throw new HttpException("Geen schrijfrechten", HttpStatus.UNAUTHORIZED);
      }
   }

   // controleer of de gebruiker toegang heeft tot de data van Startlijst/DeleteObject
   private async heeftDataToegangDeleteObject(currentUser: RefLid, id: number): Promise<void>
   {
      // zie VerwijderObject() in class.Startlijst.inc.php - PHP vergelijkt daar twee keer VLIEGER_ID, bedoeld is
      // vlieger of inzittende
      const start = await this.startlijstService.GetObject(id);
      await this.controleerEigenStart(currentUser, start, "Geen schrijfrechten");
   }

   // controleer of de gebruiker toegang heeft tot de data van Startlijst/RemoveObject
   private heeftDataToegangRemoveObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Startlijst/RestoreObject
   private async heeftDataToegangRestoreObject(currentUser: RefLid, id: number): Promise<void>
   {
      // zie HerstelObject() in class.Startlijst.inc.php, zelfde regel als DeleteObject
      const start = await this.startlijstService.GetObject(id);
      await this.controleerEigenStart(currentUser, start, "Geen schrijfrechten");
   }

   // controleer of de gebruiker toegang heeft tot de data van Startlijst/GetRecency
   private heeftDataToegangGetRecency(currentUser: RefLid, vliegerId: number): void
   {
      // de recency van een ander lid alleen met volledige toegang of als rapporteur, zie GetRecency() in
      // class.Startlijst.inc.php
      if (vliegerId !== currentUser.ID && !this.heeftVolleToegang(currentUser) && !this.permissieService.isRapporteur(currentUser))
         throw new HttpException("Geen leesrechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Startlijst/GetLogboek
   private heeftDataToegangGetLogboek(currentUser: RefLid, lidId: number): void
   {
      // zie GetLogboek() in class.Startlijst.inc.php - PHP controleert daar door een fout (isBeheerder() i.p.v.
      // !isBeheerder()) niets, hier is de bedoelde regel van GetLogboekTotalen() aangehouden
      this.controleerLogboekToegang(currentUser, lidId);
   }

   // controleer of de gebruiker toegang heeft tot de data van Startlijst/GetVliegtuigLogboek
   private async heeftDataToegangGetVliegtuigLogboek(currentUser: RefLid, vliegtuigId: number): Promise<void>
   {
      await this.controleerVliegtuigLogboekToegang(currentUser, vliegtuigId);
   }

   // controleer of de gebruiker toegang heeft tot de data van Startlijst/GetVliegtuigLogboekTotalen
   private async heeftDataToegangGetVliegtuigLogboekTotalen(currentUser: RefLid, vliegtuigId: number): Promise<void>
   {
      await this.controleerVliegtuigLogboekToegang(currentUser, vliegtuigId);
   }

   // controleer of de gebruiker toegang heeft tot de data van Startlijst/GetRecencyClubZonderInstructie
   private heeftDataToegangGetRecencyClubZonderInstructie(currentUser: RefLid, vliegerId: number): void
   {
      // zelfde regel als GetRecency(), PHP gebruikt hiervoor dezelfde functie
      if (vliegerId !== currentUser.ID && !this.heeftVolleToegang(currentUser) && !this.permissieService.isRapporteur(currentUser))
         throw new HttpException("Geen leesrechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Startlijst/GetLogboekTotalen
   private heeftDataToegangGetLogboekTotalen(currentUser: RefLid, lidId: number): void
   {
      // zie GetLogboekTotalen() in class.Startlijst.inc.php
      this.controleerLogboekToegang(currentUser, lidId);
   }

   // controleer of de gebruiker toegang heeft tot de data van Startlijst/GetVliegDagen
   private heeftDataToegangGetVliegDagen(_currentUser: RefLid): void
   {
      // PHP geeft hier geen 401, de dataset wordt beperkt, zie BeperkingGetVliegDagen()
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }
}
