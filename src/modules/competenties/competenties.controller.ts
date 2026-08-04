import {Body, Controller, Get, HttpStatus, Logger, Query, UseGuards} from '@nestjs/common';
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject, HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {ConfigService} from "@nestjs/config";
import {PermissieService} from "../authorisatie/permissie.service";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefCompetentie, RefLid} from "@prisma/client";
import {GetObjectsRefCompetentiesResponse} from "./GetObjectsRefCompetentiesResponse";
import {GetObjectsRefCompetentiesRequest} from "./GetObjectsRefCompetentiesRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CompetentiesService} from "./competenties.service";
import {RefCompetentieDto} from "../../generated/nestjs-dto/refCompetentie.dto";
import {CreateRefCompetentieDto} from "../../generated/nestjs-dto/create-refCompetentie.dto";
import {UpdateRefCompetentieDto} from "../../generated/nestjs-dto/update-refCompetentie.dto";
import {ApiBasicAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags, getSchemaPath} from "@nestjs/swagger";
import {CompetentiesBoomResponse} from "./CompetentiesBoomResponse";
import {AuthGuard} from "@nestjs/passport";
import {TypesService} from "../types/types.service";
import {Boom} from "../../core/helpers/Boom";
import {TypesGroep} from "../../core/enums/TypesGroep";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";

@Controller('Competenties')
@ApiTags('Competenties')
export class CompetentiesController extends HeliosController
{
   private readonly logger = new Logger(CompetentiesController.name);

   constructor(private readonly typesService: TypesService,
               private readonly configService: ConfigService,
               private readonly competentiesService: CompetentiesService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(RefCompetentieDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<RefCompetentieDto>
   {
      this.logger.verbose(`CompetentiesController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Competenties.GetObject');
      return await this.competentiesService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsRefCompetentiesResponse)
      async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsRefCompetentiesRequest): Promise<IHeliosGetObjectsResponse<GetObjectsRefCompetentiesResponse>>
   {
      this.logger.verbose(`CompetentiesController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      // controleer of de gebruiker de juiste rechten heeft
      this.permissieService.heeftToegang(currentUser, 'Competenties.GetObjects');

      // haal de objects op uit de database op basis van de query parameters
      return await this.competentiesService.GetObjects (queryParams);
   }

   @HeliosCreateObject(CreateRefCompetentieDto, RefCompetentieDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateRefCompetentieDto): Promise<RefCompetentieDto>
   {
      this.logger.verbose(`CompetentiesController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'Competenties.AddObject');

      // verwijder TYPE_ID uit de data
      // en voeg ze toe als connect aan het insertData object
      const { LEERFASE_ID, ...insertData} = data;
      const insert = insertData as Prisma.RefCompetentieCreateInput;
      insert.LeerfaseType = (LEERFASE_ID !== undefined) ? { connect: { ID: LEERFASE_ID } } : undefined;

      return await this.competentiesService.AddObject(insert);
   }

   @HeliosUpdateObject(UpdateRefCompetentieDto, RefCompetentieDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateRefCompetentieDto): Promise<RefCompetentie>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`CompetentiesController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Competenties.UpdateObject');

      // verwijder TYPE_ID uit de data
      // en voeg ze toe als connect aan het updateData object
      const { LEERFASE_ID, ...updateData} = data;
      const update = updateData as Prisma.RefCompetentieUpdateInput;
      update.LeerfaseType = LEERFASE_ID ? { connect: { ID: LEERFASE_ID } } : undefined;

      return await this.competentiesService.UpdateObject(id, update);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`CompetentiesController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Competenties.DeleteObject');

      const data: Prisma.RefCompetentieUpdateInput = {
         VERWIJDERD: true
      }
      await this.competentiesService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`CompetentiesController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Competenties.RemoveObject');
      await this.competentiesService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`CompetentiesController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Competenties.RestoreObject');

      const data: Prisma.RefCompetentieUpdateInput = {
         VERWIJDERD: false
      }
      await this.competentiesService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

   @Get("CompetentiesBoom")
   @ApiExtraModels(CompetentiesBoomResponse)
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiOperation({ summary: 'Boom van alle competenties.' })
   @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data.' })
   @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.' })
   @ApiResponse({ status: HttpStatus.OK, description: 'Data opgehaald.',   schema: {
      type: 'object',
      properties:
         {
            items: {$ref: getSchemaPath(CompetentiesBoomResponse)},
         }
   }})
   async CompetentiesBoom(
      @CurrentUser() currentUser: RefLid): Promise<CompetentiesBoomResponse[]>
   {
      this.logger.verbose(`CompetentiesController.CompetentiesBoom(${safeStringify({currentUser})})`);
      this.permissieService.heeftToegang(currentUser, 'Competenties.CompetentiesBoom');

      const retValue: CompetentiesBoomResponse[] = [];

      const blokken = await this.typesService.GetObjects({GROEP: TypesGroep.Opleidingsblok})
      for (let i=0 ; i < blokken.totaal ; i++)
      {
         const blok = blokken.dataset[i];
         const records = await this.competentiesService.GetObjects ({LEERFASE_ID: blok.ID});

         // alle toplevel (OUDER_ID) == null laten verwijzen naar de wortel
         const dataset =  records.dataset.map((item) =>
            item.OUDER_ID == null ? { ...item, OUDER_ID: -1 } : item
         );

         // van het type maken we een kunstmatig competentie record om zo de boom te kunnen bouwen
         dataset.push({
            ID: -1,
            LEERFASE_ID: blok.ID,
            VOLGORDE: blok.SORTEER_VOLGORDE,
            OMSCHRIJVING : blok.OMSCHRIJVING,
            OUDER_ID: undefined,

            BLOK: undefined,
            DOCUMENTATIE: undefined,
            GELDIGHEID: false,
            // todo check dit: false is niet correct aangezien score een int is van 1-5
            SCORE: undefined,
            VERWIJDERD: false,
            LAATSTE_AANPASSING: undefined
         })

         retValue.push(Boom.bouwBoom<CompetentiesBoomResponse>(dataset));
      }

      return Promise.resolve(retValue);
   }
}
