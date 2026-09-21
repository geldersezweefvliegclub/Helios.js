import {Body, Controller, Get, HttpException, HttpStatus, Logger, Query, UseGuards} from '@nestjs/common';
import {StartlijstService} from "./startlijst.service";
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
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperStartlijstResponse} from "./GetObjectsOperStartlijstResponse";
import {GetObjectsOperStartlijstRequest} from "./GetObjectsOperStartlijstRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperStartlijstDto} from "../../generated/nestjs-dto/create-operStartlijst.dto";
import {UpdateOperStartlijstDto} from "../../generated/nestjs-dto/update-operStartlijst.dto";
import {ApiBasicAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags, getSchemaPath} from "@nestjs/swagger";
import {AuthGuard} from "@nestjs/passport";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {parseDateOnly, parseTimeOnly, toDateOnly, toTimeOnly} from "../../core/helpers/TimeDate";
import {RecencyResponse} from "./RecencyResponse";
import {GetLogboekRequest} from "./GetLogboekRequest";
import {GetLogboekResponse} from "./GetLogboekResponse";
import {GetVliegtuigLogboekRequest} from "./GetVliegtuigLogboekRequest";
import {GetVliegtuigLogboekResponse} from "./GetVliegtuigLogboekResponse";
import {GetVliegtuigLogboekTotalenRequest} from "./GetVliegtuigLogboekTotalenRequest";
import {GetVliegtuigLogboekTotalenResponse} from "./GetVliegtuigLogboekTotalenResponse";
import {VliegtuigenService} from "../vliegtuigen/vliegtuigen.service";
import {RefVliegtuigDto} from "../../generated/nestjs-dto/refVliegtuig.dto";
import {RegCall} from "../../core/helpers/RegCall";

@Controller('Startlijst')
@ApiTags('Startlijst')
export class StartlijstController extends HeliosController
{
   private readonly logger = new Logger(StartlijstController.name);

   constructor(private readonly startlijstService: StartlijstService,
               private readonly vliegtuigenService: VliegtuigenService,
               private readonly permissieService: PermissieService)
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
      const obj = await this.startlijstService.GetObject(id);
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         STARTTIJD: toTimeOnly(obj.STARTTIJD) as unknown as Date,
         LANDINGSTIJD: toTimeOnly(obj.LANDINGSTIJD) as unknown as Date,
      };
   }

   @HeliosGetObjects(GetObjectsOperStartlijstResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperStartlijstRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperStartlijstResponse>>
   {
      this.logger.verbose(`StartlijstController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.GetObjects');
      return await this.startlijstService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperStartlijstDto, OperStartlijstDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperStartlijstDto): Promise<OperStartlijstDto>
   {
      this.logger.verbose(`StartlijstController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.AddObject');

      const insert = await this.normaliserenData(data) as CreateOperStartlijstDto;
      const obj = await this.startlijstService.AddObject(insert as Prisma.OperStartlijstUncheckedCreateInput, currentUser.ID);
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         STARTTIJD: toTimeOnly(obj.STARTTIJD) as unknown as Date,
         LANDINGSTIJD: toTimeOnly(obj.LANDINGSTIJD) as unknown as Date,
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

      const update = await this.normaliserenData(data) as UpdateOperStartlijstDto;
      const obj = await this.startlijstService.UpdateObject(id, update as Prisma.OperStartlijstUncheckedUpdateInput, currentUser.ID);
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         STARTTIJD: toTimeOnly(obj.STARTTIJD) as unknown as Date,
         LANDINGSTIJD: toTimeOnly(obj.LANDINGSTIJD) as unknown as Date,
      };
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`StartlijstController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.DeleteObject');

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
      await this.startlijstService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`StartlijstController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.RestoreObject');

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

      const gevraagdeDatum = datum ? parseDateOnly(datum) as Date : undefined;
      return await this.startlijstService.GetRecency(Number(vliegerId), gevraagdeDatum);
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

      const lidId = queryParams.LID_ID ?? currentUser.ID;
      return await this.startlijstService.GetLogboek(queryParams, lidId);
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

      const vliegtuig = await this.VliegtuigLogboekToegang(currentUser, queryParams.ID);
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

      const vliegtuig = await this.VliegtuigLogboekToegang(currentUser, queryParams.ID);
      const regCall = RegCall(vliegtuig.REGISTRATIE, vliegtuig.CALLSIGN);
      return await this.startlijstService.GetVliegtuigLogboekTotalen(queryParams, regCall);
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden en normaliseert
   // de datumvelden (DATUM, STARTTIJD, LANDINGSTIJD)
   private async normaliserenData(
      data: CreateOperStartlijstDto | UpdateOperStartlijstDto): Promise<CreateOperStartlijstDto | UpdateOperStartlijstDto>
   {
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
   // privékist moet de gebruiker er zelf recent (afgelopen 6 maanden) op gevlogen zijn. Geeft het
   // opgevraagde vliegtuig terug (nodig voor CLUBKIST en REG_CALL) zodat de aanroeper het niet opnieuw hoeft op te halen.
   private async VliegtuigLogboekToegang(currentUser: RefLid, vliegtuigId: number): Promise<RefVliegtuigDto>
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

      return vliegtuig;
   }
}