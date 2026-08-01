import {Body, Controller, Get, HttpException, HttpStatus, Query, UseGuards} from '@nestjs/common';
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
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<OperProgressieDto>
   {
      this.permissieService.heeftToegang(user, 'Progressie.GetObject');
      return await this.progressieService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperProgressieResponse)
   GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsOperProgressieRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperProgressieResponse>>
   {
      this.permissieService.heeftToegang(user, 'Progressie.GetObjects');
      return this.progressieService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperProgressieDto, OperProgressieDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateOperProgressieDto): Promise<OperProgressieDto>
   {
      this.permissieService.heeftToegang(user, 'Progressie.AddObject');

      // een lid mag geen eigen progressie aftekenen, zie AddObject() in class.Progressie.inc.php
      if (data.LID_ID === user.ID)
         throw new HttpException("Mag geen eigen progressie toevoegen", HttpStatus.FORBIDDEN);

      const insertData: Prisma.OperProgressieUncheckedCreateInput = {
         ...data,
         // INSTRUCTEUR_ID default naar de ingelogde gebruiker als niet expliciet meegegeven, zie RequestToRecord()
         INSTRUCTEUR_ID: data.INSTRUCTEUR_ID ?? user.ID,
      } as Prisma.OperProgressieUncheckedCreateInput;

      return await this.progressieService.AddObject(insertData);
   }

   @HeliosUpdateObject(UpdateOperProgressieDto, OperProgressieDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperProgressieDto): Promise<OperProgressieDto>
   {
      this.permissieService.heeftToegang(user, 'Progressie.UpdateObject');
      return await this.progressieService.UpdateObject(id, data);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Progressie.DeleteObject');
      await this.progressieService.SetVerwijderd(id, true);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Progressie.RemoveObject');
      await this.progressieService.RemoveObject(id);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Progressie.RestoreObject');
      await this.progressieService.SetVerwijderd(id, false);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

   @Get("ProgressieKaart")
   @ApiExtraModels(ProgressieKaartResponse)
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiOperation({summary: 'Alle competenties met de progressie van een lid erop, per leerfase.'})
   @ApiResponse({status: HttpStatus.OK, description: 'Data opgehaald.', schema: {type: 'array', items: {$ref: getSchemaPath(ProgressieKaartResponse)}}})
   async ProgressieKaart(
      @CurrentUser() user: RefLid,
      @Query('LID_ID') lidId?: number): Promise<ProgressieKaartResponse[]>
   {
      this.permissieService.heeftToegang(user, 'Progressie.ProgressieKaart');
      return this.BouwProgressieKaart(lidId ?? user.ID);
   }

   @Get("ProgressieBoom")
   @ApiExtraModels(ProgressieKaartResponse)
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiOperation({summary: 'Progressiekaart van een lid, gegroepeerd in een boomstructuur per leerfase.'})
   @ApiResponse({status: HttpStatus.OK, description: 'Data opgehaald.', schema: {type: 'array', items: {$ref: getSchemaPath(ProgressieKaartResponse)}}})
   async ProgressieBoom(
      @CurrentUser() user: RefLid,
      @Query('LID_ID') lidId?: number): Promise<ProgressieKaartResponse[]>
   {
      this.permissieService.heeftToegang(user, 'Progressie.ProgressieBoom');

      const kaart = await this.BouwProgressieKaart(lidId ?? user.ID);
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
      @CurrentUser() user: RefLid,
      @Query('LID_ID') lidId: number): Promise<StartAantekeningenResponse>
   {
      this.permissieService.heeftToegang(user, 'Progressie.StartAantekeningen');

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