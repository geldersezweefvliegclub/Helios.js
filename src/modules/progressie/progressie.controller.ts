import {Body, Controller, forwardRef, Get, HttpException, HttpStatus, Inject, Logger, Query, UseGuards} from '@nestjs/common';
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
import {HeeftCompetentieRequest} from "./HeeftCompetentieRequest";
import {HeeftCompetentieResponse} from "./HeeftCompetentieResponse";
import {TypesGroep} from "../../core/enums/TypesGroep";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {parseDateOnly, toDateOnly} from "../../core/helpers/TimeDate";

// competentie IDs voor de startmethodes die op de startaantekeningen kaart getoond worden,
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
               @Inject(forwardRef(() => LedenService)) private readonly ledenService: LedenService,
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
      await this.heeftDataToegangGetObject(currentUser, id);
      const obj = await this.progressieService.GetObject(id);
      return {
         ...obj,
         GELDIG_TOT: toDateOnly(obj.GELDIG_TOT) as unknown as Date
      };
   }

   @HeliosGetObjects(GetObjectsOperProgressieResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperProgressieRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperProgressieResponse>>
   {
      this.logger.verbose(`ProgressieController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Progressie.GetObjects');
      this.heeftDataToegangGetObjects(currentUser, queryParams.LID_ID);

      // als er geen LID_ID is opgegeven, dan default naar het ID van de ingelogde gebruiker
      const lidID = queryParams.LID_ID === undefined ? currentUser.ID : queryParams.LID_ID;
      queryParams.LID_ID = lidID;

      return await this.progressieService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperProgressieDto, OperProgressieDto)
   @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Mag geen eigen progressie toevoegen.'})
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperProgressieDto): Promise<OperProgressieDto>
   {
      this.logger.verbose(`ProgressieController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'Progressie.AddObject');
      this.heeftDataToegangAddObject(currentUser);

      // LID_ID en COMPETENTIE_ID zijn verplicht
      if (data.LID_ID === undefined || data.LID_ID === null)
         throw new HttpException("LID_ID is verplicht", HttpStatus.BAD_REQUEST);
      if (data.COMPETENTIE_ID === undefined || data.COMPETENTIE_ID === null)
         throw new HttpException("COMPETENTIE_ID is verplicht", HttpStatus.BAD_REQUEST);

      // een lid mag geen eigen progressie aftekenen, zie AddObject() in class.Progressie.inc.php
      if (data.LID_ID === currentUser.ID)
         throw new HttpException("Mag geen eigen progressie toevoegen", HttpStatus.FORBIDDEN);

      const genormaliseerd = await this.normaliserenData(data) as CreateOperProgressieDto;
      const insertData: Prisma.OperProgressieUncheckedCreateInput = {
         ...genormaliseerd,
         INSTRUCTEUR_ID: genormaliseerd.INSTRUCTEUR_ID ?? currentUser.ID,
         GELDIG_TOT: parseDateOnly(genormaliseerd.GELDIG_TOT as Date | string | null)
      } as Prisma.OperProgressieUncheckedCreateInput;

      const obj = await this.progressieService.AddObject(insertData, currentUser.ID);
      return {...obj, GELDIG_TOT: toDateOnly(obj.GELDIG_TOT) as unknown as Date};
   }

   @HeliosUpdateObject(UpdateOperProgressieDto, OperProgressieDto)
   @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Mag geen eigen progressie aanpassen.'})
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperProgressieDto): Promise<OperProgressieDto>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`ProgressieController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Progressie.UpdateObject');
      this.heeftDataToegangUpdateObject(currentUser);

      // een lid mag geen eigen progressie aanpassen, of een progressie op zichzelf zetten
      const bestaand = await this.progressieService.GetObject(id);
      const nieuweLidId = data.LID_ID ?? bestaand.LID_ID;
      if (nieuweLidId === currentUser.ID)
         throw new HttpException("Mag geen eigen progressie aanpassen", HttpStatus.FORBIDDEN);

      const genormaliseerd = await this.normaliserenData(data) as UpdateOperProgressieDto;
      const updateData: Prisma.OperProgressieUncheckedUpdateInput = {
         ...genormaliseerd,
         GELDIG_TOT: genormaliseerd.GELDIG_TOT !== undefined
            ? parseDateOnly(genormaliseerd.GELDIG_TOT as Date | string | null)
            : undefined,
      } as Prisma.OperProgressieUncheckedUpdateInput;

      const obj = await this.progressieService.UpdateObject(id, updateData, currentUser.ID);
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
   @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Mag geen eigen progressie verwijderen.'})
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`ProgressieController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Progressie.DeleteObject');
      this.heeftDataToegangDeleteObject(currentUser);

      // een lid mag eigen progressie niet verwijderen
      const bestaand = await this.progressieService.GetObject(id);
      if (bestaand.LID_ID === currentUser.ID)
         throw new HttpException("Mag geen eigen progressie verwijderen", HttpStatus.FORBIDDEN);

      await this.progressieService.UpdateObject(id, {VERWIJDERD: true}, currentUser.ID);
   }

   @HeliosRemoveObject()
   @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Mag geen eigen progressie verwijderen.'})
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`ProgressieController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Progressie.RemoveObject');
      this.heeftDataToegangRemoveObject(currentUser);

      const bestaand = await this.progressieService.GetObject(id);
      if (bestaand.LID_ID === currentUser.ID)
         throw new HttpException("Mag geen eigen progressie verwijderen", HttpStatus.FORBIDDEN);

      await this.progressieService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Mag geen eigen progressie terugzetten.'})
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`ProgressieController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Progressie.RestoreObject');
      this.heeftDataToegangRestoreObject(currentUser);

      // een lid mag eigen progressie niet terugzetten
      const bestaand = await this.progressieService.GetObject(id);
      if (bestaand.LID_ID === currentUser.ID)
         throw new HttpException("Mag geen eigen progressie terugzetten", HttpStatus.FORBIDDEN);

      await this.progressieService.UpdateObject(id, {VERWIJDERD: false}, currentUser.ID);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

   @Get("ProgressieKaart")
   @ApiExtraModels(ProgressieKaartResponse)
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiOperation({summary: 'Alle competenties met de progressie van een lid erop, per leerfase.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({status: HttpStatus.OK, description: 'Data opgehaald.', schema: {type: 'array', items: {$ref: getSchemaPath(ProgressieKaartResponse)}}})
   async ProgressieKaart(
      @CurrentUser() currentUser: RefLid,
      @Query('LID_ID') lidId?: number): Promise<ProgressieKaartResponse[]>
   {
      this.logger.verbose(`ProgressieController.ProgressieKaart(${safeStringify({currentUser, lidId})})`);
      this.permissieService.heeftToegang(currentUser, 'Progressie.ProgressieKaart');
      this.heeftDataToegangProgressieKaart(currentUser, lidId);
      return await this.BouwProgressieKaart(lidId ?? currentUser.ID);
   }

   @Get("ProgressieBoom")
   @ApiExtraModels(ProgressieKaartResponse)
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiOperation({summary: 'Progressiekaart van een lid, gegroepeerd in een boomstructuur per leerfase.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({status: HttpStatus.OK, description: 'Data opgehaald.', schema: {type: 'array', items: {$ref: getSchemaPath(ProgressieKaartResponse)}}})
   async ProgressieBoom(
      @CurrentUser() currentUser: RefLid,
      @Query('LID_ID') lidId?: number): Promise<ProgressieKaartResponse[]>
   {
      this.logger.verbose(`ProgressieController.ProgressieBoom(${safeStringify({currentUser, lidId})})`);
      this.permissieService.heeftToegang(currentUser, 'Progressie.ProgressieBoom');
      this.heeftDataToegangProgressieBoom(currentUser, lidId);
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

   @Get("HeeftCompetentie")
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiOperation({summary: 'Bepaal welke leden een progressie record hebben voor de opgegeven competentie.'})
   @ApiResponse({status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({status: HttpStatus.OK, description: 'Lid IDs opgehaald.', type: HeeftCompetentieResponse})
   async HeeftCompetentie(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: HeeftCompetentieRequest): Promise<HeeftCompetentieResponse>
   {
      this.logger.verbose(`ProgressieController.HeeftCompetentie(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Progressie.HeeftCompetentie');
      this.heeftDataToegangHeeftCompetentie(currentUser);
      const LID_IDS = await this.progressieService.HeeftCompetentie(queryParams.COMPETENTIE_ID, queryParams.LID_ID);
      return {LID_IDS};
   }

   @Get("StartAantekeningen")
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiOperation({summary: 'Welke startmethodes (lieren/slepen/zelfstart) mag dit lid uitvoeren?'})
   @ApiResponse({status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
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
      this.heeftDataToegangStartAantekeningen(currentUser, lidId);

      // lidId is een kale @Query param zonder class-validator, dus een weggelaten LID_ID komt hier als
      // undefined binnen ondanks de "number"-typering
      if (lidId === undefined || lidId === null)
         throw new HttpException("LID_ID is verplicht", HttpStatus.BAD_REQUEST);

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

   // bouwt de platte progressiekaart: alle competenties per leerfase
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

   // zie heeftDataToegang() in include/helios.php - beheerder, instructeur of CIMT hebben data-toegang tot
   // andermans progressie
   private isBeheerderInstructeurOfCIMT(currentUser: RefLid): boolean
   {
      return this.permissieService.isBeheerder(currentUser)
         || this.permissieService.isInstructeur(currentUser)
         || this.permissieService.isCIMT(currentUser);
   }

   // de progressie van een lid mag alleen door het lid zelf, of door iemand met data-toegang bekeken worden
   private controleerLidToegang(currentUser: RefLid, lidId: number): void
   {
      const ikBenHetZelf = this.permissieService.ikBenHetZelf({ID: lidId} as RefLid, currentUser);
      if (!ikBenHetZelf && !this.isBeheerderInstructeurOfCIMT(currentUser))
         throw new HttpException("Geen rechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Progressie/GetObject
   private async heeftDataToegangGetObject(currentUser: RefLid, id: number): Promise<void>
   {
      // ophalen mag alleen door het lid zelf, of iemand met data-toegang, zie GetObject() in class.Progressie.inc.php
      const obj = await this.progressieService.GetObject(id);
      this.controleerLidToegang(currentUser, obj.LID_ID);
   }

   // controleer of de gebruiker toegang heeft tot de data van Progressie/GetObjects
   private heeftDataToegangGetObjects(currentUser: RefLid, lidId?: number): void
   {
      // zonder LID_ID wordt de eigen progressie opgehaald, een ander lid alleen met data-toegang
      this.controleerLidToegang(currentUser, lidId ?? currentUser.ID);
   }

   // controleer of de gebruiker toegang heeft tot de data van Progressie/AddObject
   private heeftDataToegangAddObject(currentUser: RefLid): void
   {
      // schrijven mag alleen door iemand met data-toegang, zoals instructeur, CIMT of beheerder
      if (!this.isBeheerderInstructeurOfCIMT(currentUser))
         throw new HttpException("Geen schrijfrechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Progressie/UpdateObject
   private heeftDataToegangUpdateObject(currentUser: RefLid): void
   {
      // schrijven mag alleen door iemand met data-toegang, zoals instructeur, CIMT of beheerder
      if (!this.isBeheerderInstructeurOfCIMT(currentUser))
         throw new HttpException("Geen schrijfrechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Progressie/DeleteObject
   private heeftDataToegangDeleteObject(currentUser: RefLid): void
   {
      // schrijven mag alleen door iemand met data-toegang, zoals instructeur, CIMT of beheerder
      if (!this.isBeheerderInstructeurOfCIMT(currentUser))
         throw new HttpException("Geen schrijfrechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Progressie/RemoveObject
   private heeftDataToegangRemoveObject(currentUser: RefLid): void
   {
      // schrijven mag alleen door iemand met data-toegang, zoals instructeur, CIMT of beheerder
      if (!this.isBeheerderInstructeurOfCIMT(currentUser))
         throw new HttpException("Geen schrijfrechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Progressie/RestoreObject
   private heeftDataToegangRestoreObject(currentUser: RefLid): void
   {
      // schrijven mag alleen door iemand met data-toegang, zoals instructeur, CIMT of beheerder
      if (!this.isBeheerderInstructeurOfCIMT(currentUser))
         throw new HttpException("Geen schrijfrechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Progressie/ProgressieKaart
   private heeftDataToegangProgressieKaart(currentUser: RefLid, lidId?: number): void
   {
      // zie ProgressieKaart() in class.Progressie.inc.php: een ander LID_ID opvragen mag alleen met data-toegang
      this.controleerLidToegang(currentUser, lidId ?? currentUser.ID);
   }

   // controleer of de gebruiker toegang heeft tot de data van Progressie/ProgressieBoom
   private heeftDataToegangProgressieBoom(currentUser: RefLid, lidId?: number): void
   {
      // zie ProgressieBoom() in class.Progressie.inc.php: een ander LID_ID opvragen mag alleen met data-toegang
      this.controleerLidToegang(currentUser, lidId ?? currentUser.ID);
   }

   // controleer of de gebruiker toegang heeft tot de data van Progressie/HeeftCompetentie
   private heeftDataToegangHeeftCompetentie(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Progressie/StartAantekeningen
   private heeftDataToegangStartAantekeningen(currentUser: RefLid, lidId?: number): void
   {
      // zie StartAantekeningen() in class.Progressie.inc.php: een ander LID_ID opvragen mag alleen met data-toegang
      this.controleerLidToegang(currentUser, lidId ?? currentUser.ID);
   }
}
