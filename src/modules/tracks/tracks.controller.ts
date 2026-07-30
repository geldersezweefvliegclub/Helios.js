import {Body, Controller, HttpException, HttpStatus, Query} from '@nestjs/common';
import {TracksService} from "./tracks.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperTrackDto} from "../../generated/nestjs-dto/operTrack.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperTracksResponse} from "./GetObjectsOperTracksResponse";
import {GetObjectsOperTracksRequest} from "./GetObjectsOperTracksRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperTrackDto} from "../../generated/nestjs-dto/create-operTrack.dto";
import {UpdateOperTrackDto} from "../../generated/nestjs-dto/update-operTrack.dto";
import {ApiTags} from "@nestjs/swagger";

@Controller('Tracks')
@ApiTags('Tracks')
export class TracksController extends HeliosController
{
   constructor(private readonly tracksService: TracksService,
               private readonly permissieService: PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperTrackDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<OperTrackDto>
   {
      this.permissieService.heeftToegang(user, 'Tracks.GetObject');
      return await this.tracksService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperTracksResponse)
   GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsOperTracksRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperTracksResponse>>
   {
      this.permissieService.heeftToegang(user, 'Tracks.GetObjects');
      return this.tracksService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperTrackDto, OperTrackDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateOperTrackDto): Promise<OperTrackDto>
   {
      this.permissieService.heeftToegang(user, 'Tracks.AddObject');

      // LINK_ID en INGEVOERD worden enkel intern door UpdateObject beheerd, zie class.Tracks.inc.php RequestToRecord()
      if ('LINK_ID' in data || 'INGEVOERD' in data)
         throw new HttpException("LINK_ID en INGEVOERD kunnen niet extern gezet worden", HttpStatus.BAD_REQUEST);

      const {LID_ID, INSTRUCTEUR_ID, START_ID, ...rest} = data;

      const insertData: Prisma.OperTrackCreateInput = {
         ...rest,
         Lid: {connect: {ID: LID_ID}},
         Instructeur: INSTRUCTEUR_ID !== undefined ? {connect: {ID: INSTRUCTEUR_ID}} : undefined,
         Startlijst: START_ID !== undefined ? {connect: {ID: START_ID}} : undefined,
      };

      return await this.tracksService.AddObject(insertData);
   }

   @HeliosUpdateObject(UpdateOperTrackDto, OperTrackDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperTrackDto): Promise<OperTrackDto>
   {
      this.permissieService.heeftToegang(user, 'Tracks.UpdateObject');

      if ('LINK_ID' in data || 'INGEVOERD' in data)
         throw new HttpException("LINK_ID en INGEVOERD kunnen niet extern gezet worden", HttpStatus.BAD_REQUEST);

      return await this.tracksService.UpdateObject(id, data);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Tracks.DeleteObject');
      await this.tracksService.SetVerwijderd(id, true);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Tracks.RemoveObject');
      await this.tracksService.RemoveObject(id);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Tracks.RestoreObject');
      await this.tracksService.SetVerwijderd(id, false);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

}