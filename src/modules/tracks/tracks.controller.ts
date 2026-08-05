import {Body, Controller, HttpException, HttpStatus, Logger, Query} from '@nestjs/common';
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
import {RefLid} from "@prisma/client";
import {GetObjectsOperTracksResponse} from "./GetObjectsOperTracksResponse";
import {GetObjectsOperTracksRequest} from "./GetObjectsOperTracksRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperTrackDto} from "../../generated/nestjs-dto/create-operTrack.dto";
import {UpdateOperTrackDto} from "../../generated/nestjs-dto/update-operTrack.dto";
import {ApiTags} from "@nestjs/swagger";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";

@Controller('Tracks')
@ApiTags('Tracks')
export class TracksController extends HeliosController
{
   private readonly logger = new Logger(TracksController.name);

   constructor(private readonly tracksService: TracksService,
               private readonly permissieService: PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperTrackDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperTrackDto>
   {
      this.logger.verbose(`TracksController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Tracks.GetObject');
      return await this.tracksService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperTracksResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperTracksRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperTracksResponse>>
   {
      this.logger.verbose(`TracksController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Tracks.GetObjects');
      return await this.tracksService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperTrackDto, OperTrackDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperTrackDto): Promise<OperTrackDto>
   {
      this.logger.verbose(`TracksController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'Tracks.AddObject');

      // LINK_ID en INGEVOERD worden enkel intern door UpdateObject beheerd, zie class.Tracks.inc.php RequestToRecord()
      if ('LINK_ID' in data || 'INGEVOERD' in data)
         throw new HttpException("LINK_ID en INGEVOERD kunnen niet extern gezet worden", HttpStatus.BAD_REQUEST);

      // TEKST is niet verplicht op DB niveau, maar wel verplicht volgens de business regel uit class.Tracks.inc.php AddObject()
      if (!data.TEKST)
         throw new HttpException("TEKST is verplicht", HttpStatus.BAD_REQUEST);

      const insert = await this.normaliserenData(data) as CreateOperTrackDto;
      return await this.tracksService.AddObject(insert, currentUser.ID);
   }

   @HeliosUpdateObject(UpdateOperTrackDto, OperTrackDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperTrackDto): Promise<OperTrackDto>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`TracksController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Tracks.UpdateObject');

      if ('LINK_ID' in data || 'INGEVOERD' in data)
         throw new HttpException("LINK_ID en INGEVOERD kunnen niet extern gezet worden", HttpStatus.BAD_REQUEST);

      const update = await this.normaliserenData(data) as UpdateOperTrackDto;
      return await this.tracksService.UpdateObject(id, update, currentUser.ID);
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden
   private async normaliserenData(
      data: CreateOperTrackDto | UpdateOperTrackDto): Promise<CreateOperTrackDto | UpdateOperTrackDto>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      return data;
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`TracksController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Tracks.DeleteObject');
      await this.tracksService.SetVerwijderd(id, true, currentUser.ID);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`TracksController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Tracks.RemoveObject');
      await this.tracksService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`TracksController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Tracks.RestoreObject');
      await this.tracksService.SetVerwijderd(id, false, currentUser.ID);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

}