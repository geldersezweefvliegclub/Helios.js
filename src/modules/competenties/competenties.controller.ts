import {Body, Controller, Get, HttpStatus, Query, UseGuards} from '@nestjs/common';
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

@Controller('Competenties')
@ApiTags('Competenties')
export class CompetentiesController extends HeliosController
{
   constructor(private readonly typesService: TypesService,
               private readonly configService: ConfigService,
               private readonly competentiesService: CompetentiesService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(RefCompetentieDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<RefCompetentieDto>
   {
      this.permissieService.heeftToegang(user, 'Competenties.GetObject');
      return await this.competentiesService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsRefCompetentiesResponse)
      GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsRefCompetentiesRequest): Promise<IHeliosGetObjectsResponse<GetObjectsRefCompetentiesResponse>>
   {
      // check if the user has the right permissions
      this.permissieService.heeftToegang(user, 'Competenties.GetObjects');

      // retrieve the objects from the database based on the query parameters
      return this.competentiesService.GetObjects (queryParams);
   }

   @HeliosCreateObject(CreateRefCompetentieDto, RefCompetentieDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateRefCompetentieDto): Promise<RefCompetentieDto>
   {
      this.permissieService.heeftToegang(user, 'Competenties.AddObject');

      // remove TYPE_ID from the data
      // and add them as connect to the insertData object
      const { LEERFASE_ID, ...insertData} = data;
      (insertData as Prisma.RefCompetentieCreateInput).LeerfaseType = (LEERFASE_ID !== undefined) ? { connect: {ID: LEERFASE_ID }} : undefined;

      return await this.competentiesService.AddObject(insertData as Prisma.RefCompetentieCreateInput);
   }

   @HeliosUpdateObject(UpdateRefCompetentieDto, RefCompetentieDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateRefCompetentieDto): Promise<RefCompetentie>
   {
      this.permissieService.heeftToegang(user, 'Competenties.UpdateObject');

      // remove TYPE_ID from the data
      // and add them as connect to the updateData object
      const { LEERFASE_ID, ...updateData} = data;
      (updateData as Prisma.RefCompetentieCreateInput).LeerfaseType = LEERFASE_ID ? { connect: {ID: LEERFASE_ID }} : undefined;

      return await this.competentiesService.UpdateObject(id, updateData as Prisma.RefCompetentieUpdateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Competenties.DeleteObject');

      const data: Prisma.RefCompetentieUpdateInput = {
         VERWIJDERD: true
      }
      await this.competentiesService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Competenties.RemoveObject');
      await this.competentiesService.RemoveObject(id);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Competenties.RestoreObject');

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
      @CurrentUser() user: RefLid): Promise<CompetentiesBoomResponse[]>
   {
      this.permissieService.heeftToegang(user, 'Competenties.CompetentiesBoom');

      const retValue: CompetentiesBoomResponse[] = [];

      const blokken = await this.typesService.GetObjects({GROEP: 10})
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
            SCORE: false,
            VERWIJDERD: false,
            LAATSTE_AANPASSING: undefined
         })

         retValue.push(Boom.bouwBoom<CompetentiesBoomResponse>(dataset));
      }

      return Promise.resolve(retValue)
   }
}
