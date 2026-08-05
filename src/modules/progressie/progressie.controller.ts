import {Body, Controller, Get, HttpException, HttpStatus, Logger, Query, UseGuards} from '@nestjs/common';
import {ProgressieService} from "./progressie.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperProgressieDto} from "../../generated/nestjs-dto/operProgressie.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperProgressieResponse} from "./GetObjectsOperProgressieResponse";
import {GetObjectsOperProgressieRequest} from "./GetObjectsOperProgressieRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperProgressieDto} from "../../generated/nestjs-dto/create-operProgressie.dto";
import {UpdateOperProgressieDto} from "../../generated/nestjs-dto/update-operProgressie.dto";
import {ApiBasicAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags, getSchemaPath} from "@nestjs/swagger";
import {AuthGuard} from "@nestjs/passport";
import {TypesService} from "../types/types.service";
import {CompetentiesService} from "../competenties/competenties.service";
import {LedenService} from "../leden/leden.service";
import {Boom} from "../../core/helpers/Boom";
import {ProgressieKaartResponse} from "./ProgressieKaartResponse";
import {TypesGroep} from "../../core/enums/TypesGroep";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {parseDateOnly, toDateOnly} from "../../core/helpers/DateOnly";

// competentie IDs voor de startmethodes die op de startaantekeningen kaart getoond worden, zie
// StartAantekeningen() in class.Progressie.inc.php
const COMPETENTIE_LIEREN = 272;
const COMPETENTIE_SLEPEN = 273;
const COMPETENTIE_ZELFSTART = 274;

export class StartAantekeningenResponse
{
   lieren: boolean;
   slepen: boolean;
   zelfstart: boolean;
}

@Controller('Progressie')
@ApiTags('Progressie')
export class ProgressieController extends HeliosController
{
   private readonly logger = new Logger(ProgressieController.name);

   constructor(private readonly progressieService: ProgressieService,
               private readonly competentiesService: CompetentiesService,
               private readonly typesService: TypesService,
               private readonly ledenService: LedenService,
               private readonly permissieService: PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperProgressieDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperProgressieDto>
   {
      this.logger.verbose(`ProgressieController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Progressie.GetObject');
      const obj = await this.progressieService.GetObject(id);
      return {...obj, GELDIG_TOT: toDateOnly(obj.GELDIG_TOT) as unknown as Date};
   }

   @HeliosGetObjects(GetObjectsOperProgressieResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperProgressieRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperProgressieResponse>>
   {
      this.logger.verbose(`ProgressieController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Progressie.GetObjects');
      return await this.progressieService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperProgressieDto, OperProgressieDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperProgressieDto): Promise<OperProgressieDto>
   {
      this.logger.verbose(`ProgressieController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'Progressie.AddObject');

      // een lid mag geen eigen progressie aftekenen, zie AddObject() in class.Progressie.inc.php
      if (data.LID_ID === currentUser.ID)
         throw new HttpException("Mag geen eigen progressie toevoegen", HttpStatus.FORBIDDEN);

      const genormaliseerd = await this.normaliserenData(data) as CreateOperProgressieDto;
      const insertData: Prisma.OperProgressieUncheckedCreateInput = {
         ...genormaliseerd,
         // INSTRUCTEUR_ID default naar de ingelogde gebruiker als niet expliciet meegegeven, zie RequestToRecord()
         INSTRUCTEUR_ID: genormaliseerd.INSTRUCTEUR_ID ?? currentUser.ID,
      } as Prisma.OperProgressieUncheckedCreateInput;
      insertData.GELDIG_TOT = parseDateOnly(insertData.GELDIG_TOT as Date | string | null);

      const obj = await this.progressieService.AddObject(insertData, currentUser.ID);
      return {...obj, GELDIG_TOT: toDateOnly(obj.GELDIG_TOT) as unknown as Date};
   }

   @HeliosUpdateObject(UpdateOperProgressieDto, OperProgressieDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperProgressieDto): Promise<OperProgressieDto>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`ProgressieController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Progressie.UpdateObject');

      const update = await this.normaliserenData(data) as UpdateOperProgressieDto;
      const obj = await this.progressieService.UpdateObject(id, update, currentUser.ID);
      return {...obj, GELDIG_TOT: toDateOnly(obj.GELDIG_TOT) as unknown as Date};
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden VERWIJDERD en
   // LAATSTE_AANPASSING - deze mogen nooit direct door de client gezet worden, ook al accepteert de DTO ze
   private async normaliserenData(
      data: CreateOperProgressieDto | UpdateOperProgressieDto): Promise<CreateOperProgressieDto | UpdateOperProgressieDto>
   {
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;

      return data;
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`ProgressieController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Progressie.DeleteObject');
      await this.progressieService.SetVerwijderd(id, true, currentUser.ID);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`ProgressieController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Progressie.RemoveObject');
      await this.progressieService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`ProgressieController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Progressie.RestoreObject');
      await this.progressieService.SetVerwijderd(id, false, currentUser.ID);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

   @Get("ProgressieKaart")
   @ApiExtraModels(ProgressieKaartResponse)
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiOperation({summary: 'Alle competenties met de progressie van een lid erop, per leerfase.'})
   @ApiResponse({status: HttpStatus.OK, description: 'Data opgehaald.', schema: {type: 'array', items: {$ref: getSchemaPath(ProgressieKaartResponse)}}})
   async ProgressieKaart(
      @CurrentUser() currentUser: RefLid,
      @Query('LID_ID') lidId?: number): Promise<ProgressieKaartResponse[]>
   {
      this.logger.verbose(`ProgressieController.ProgressieKaart(${safeStringify({currentUser, lidId})})`);
      this.permissieService.heeftToegang(currentUser, 'Progressie.ProgressieKaart');
      return await this.BouwProgressieKaart(lidId ?? currentUser.ID);
   }

   @Get("ProgressieBoom")
   @ApiExtraModels(ProgressieKaartResponse)
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiOperation({summary: 'Progressiekaart van een lid, gegroepeerd in een boomstructuur per leerfase.'})
   @ApiResponse({status: HttpStatus.OK, description: 'Data opgehaald.', schema: {type: 'array', items: {$ref: getSchemaPath(ProgressieKaartResponse)}}})
   async ProgressieBoom(
      @CurrentUser() currentUser: RefLid,
      @Query('LID_ID') lidId?: number): Promise<ProgressieKaartResponse[]>
   {
      this.logger.verbose(`ProgressieController.ProgressieBoom(${safeStringify({currentUser, lidId})})`);
      this.permissieService.heeftToegang(currentUser, 'Progressie.ProgressieBoom');

      const kaart = await this.BouwProgressieKaart(lidId ?? currentUser.ID);
      const retValue: ProgressieKaartResponse[] = [];

      const leerfasen = await this.typesService.GetObjects({GROEP: TypesGroep.Opleidingsblok});
      for (const leerfase of leerfasen.dataset)
      {
         const dataset = kaart
            .filter(item => item.LEERFASE_ID === leerfase.ID)
            .map(item => item.OUDER_ID == null ? {...item, OUDER_ID: -1} : item);

         // van de leerfase maken we een kunstmatig record om zo de boom te kunnen bouwen, net als bij CompetentiesBoom
         dataset.push({
            ID: -1,
            LEERFASE_ID: leerfase.ID,
            VOLGORDE: leerfase.SORTEER_VOLGORDE,
            OMSCHRIJVING: leerfase.OMSCHRIJVING,
            OUDER_ID: undefined,
         } as unknown as ProgressieKaartResponse);

         retValue.push(Boom.bouwBoom<ProgressieKaartResponse>(dataset));
      }

      return retValue;
   }

   @Get("StartAantekeningen")
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiOperation({summary: 'Welke startmethodes (lieren/slepen/zelfstart) mag dit lid uitvoeren?'})
   @ApiResponse({status: HttpStatus.OK, description: 'Data opgehaald.', schema: {
      type: 'object',
      properties: {lieren: {type: 'boolean'}, slepen: {type: 'boolean'}, zelfstart: {type: 'boolean'}}
   }})
   async StartAantekeningen(
      @CurrentUser() currentUser: RefLid,
      @Query('LID_ID') lidId: number): Promise<StartAantekeningenResponse>
   {
      this.logger.verbose(`ProgressieController.StartAantekeningen(${safeStringify({currentUser, lidId})})`);
      this.permissieService.heeftToegang(currentUser, 'Progressie.StartAantekeningen');

      await this.ledenService.GetObject(lidId); // gooit 404 als lid niet bestaat

      const behaald = await this.progressieService.GetObjects({
         LID_ID: lidId,
         IN: [COMPETENTIE_LIEREN, COMPETENTIE_SLEPEN, COMPETENTIE_ZELFSTART],
      } as GetObjectsOperProgressieRequest);

      const competentieIds = new Set(behaald.dataset.map(item => item.COMPETENTIE_ID));
      return {
         lieren: competentieIds.has(COMPETENTIE_LIEREN),
         slepen: competentieIds.has(COMPETENTIE_SLEPEN),
         zelfstart: competentieIds.has(COMPETENTIE_ZELFSTART),
      };
   }

   // bouwt de platte progressiekaart: alle competenties per leerfase, met (indien aanwezig) de progressie van het
   // opgegeven lid erop geplakt, zie ProgressieKaart() in class.Progressie.inc.php
   private async BouwProgressieKaart(lidId: number): Promise<ProgressieKaartResponse[]>
   {
      this.logger.verbose(`ProgressieController.BouwProgressieKaart(${safeStringify({lidId})})`);
      const leerfasen = await this.typesService.GetObjects({GROEP: TypesGroep.Opleidingsblok});
      const progressie = await this.progressieService.GetObjects({LID_ID: lidId} as GetObjectsOperProgressieRequest);
      const progressiePerCompetentie = new Map(progressie.dataset.map(item => [item.COMPETENTIE_ID, item]));

      const kaart: ProgressieKaartResponse[] = [];
      for (const leerfase of leerfasen.dataset)
      {
         const competenties = await this.competentiesService.GetObjects({LEERFASE_ID: leerfase.ID});
         for (const competentie of competenties.dataset)
         {
            const behaald = progressiePerCompetentie.get(competentie.ID);
            kaart.push({
               ...competentie,
               PROGRESSIE_ID: behaald?.ID ?? null,
               INSTRUCTEUR_NAAM: behaald?.INSTRUCTEUR_NAAM ?? null,
               INGEVOERD: behaald?.INGEVOERD ?? null,
               SCORE: behaald?.SCORE ?? null,
               GELDIG_TOT: behaald?.GELDIG_TOT ?? null,
               OPMERKINGEN: behaald?.OPMERKINGEN ?? null,
            } as ProgressieKaartResponse);
         }
      }
      return kaart;
   }
}