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
import {Prisma, RefLid} from "@prisma/client";
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
      this.permissieService.heeftToegang(currentUser, 'Tracks.AddObject');
      bodyHeeftData(data);

      const insert = await this.normaliserenData(data) as Prisma.OperTrackUncheckedCreateInput;
      return await this.tracksService.AddObject(insert, currentUser.ID);
   }

   @HeliosUpdateObject(UpdateOperTrackDto, OperTrackDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperTrackDto): Promise<OperTrackDto>
   {
      this.logger.verbose(`TracksController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Tracks.UpdateObject');
      bodyHeeftData(data);
      id = id ?? data.ID;
      await this.magAanpassen(currentUser, id);

      const update = await this.normaliserenData(data) as Prisma.OperTrackUncheckedUpdateInput;
      return await this.tracksService.UpdateObject(id, update, currentUser.ID);
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden.
   // LID_ID, INSTRUCTEUR_ID en START_ID hoeven niet omgezet te worden naar relatie-connects: met het
   // Unchecked Prisma inputtype zijn dit al platte kolommen
   private async normaliserenData(
      data: CreateOperTrackDto | UpdateOperTrackDto): Promise<Prisma.OperTrackUncheckedCreateInput | Prisma.OperTrackUncheckedUpdateInput>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      // INGEVOERD wordt enkel intern beheerd, een eventueel meegegeven waarde wordt hier, net als
      // VERWIJDERD en LAATSTE_AANPASSING, altijd genegeerd
      delete data.INGEVOERD;

      return data as Prisma.OperTrackUncheckedCreateInput | Prisma.OperTrackUncheckedUpdateInput;
   }

   // update en verwijderen mag alleen door een beheerder, CIMT, of de instructeur die de track zelf heeft ingevoerd
   private async magAanpassen(currentUser: RefLid, id: number): Promise<void>
   {
      if (this.permissieService.isBeheerder(currentUser) || this.permissieService.isCIMT(currentUser))
         return;

      const track = await this.tracksService.GetObject(id);
      if (track.INSTRUCTEUR_ID !== currentUser.ID)
         throw new HttpException(`Niet toegestaan om deze track aan te passen of te verwijderen`, HttpStatus.UNAUTHORIZED);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`TracksController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Tracks.DeleteObject');
      await this.magAanpassen(currentUser, id);

      const data: Prisma.OperTrackUncheckedUpdateInput = {
         VERWIJDERD: true
      }
      await this.tracksService.UpdateObject(id, data, currentUser.ID);
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

      const data: Prisma.OperTrackUncheckedUpdateInput = {
         VERWIJDERD: false
      }
      await this.tracksService.UpdateObject(id, data, currentUser.ID);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

}