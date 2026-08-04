import {Body, Controller, HttpException, HttpStatus, Logger, Query} from '@nestjs/common';
import {AanwezigLedenService} from "./aanwezig-leden.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperAanwezigLidDto} from "../../generated/nestjs-dto/operAanwezigLid.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperAanwezigLedenResponse} from "./GetObjectsOperAanwezigLedenResponse";
import {GetObjectsOperAanwezigLedenRequest} from "./GetObjectsOperAanwezigLedenRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperAanwezigLidDto} from "../../generated/nestjs-dto/create-operAanwezigLid.dto";
import {UpdateOperAanwezigLidDto} from "../../generated/nestjs-dto/update-operAanwezigLid.dto";
import {ApiTags} from "@nestjs/swagger";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {toDateOnly, toTimeOnly} from "../../core/helpers/DateOnly";

@Controller('AanwezigLeden')
@ApiTags('AanwezigLeden')
export class AanwezigLedenController  extends HeliosController
{
   private readonly logger = new Logger(AanwezigLedenController.name);

   constructor(private readonly AanwezigLedenService: AanwezigLedenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperAanwezigLidDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperAanwezigLidDto>
   {
      this.logger.verbose(`AanwezigLedenController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigLeden.GetObject');
      const obj = await this.AanwezigLedenService.GetObject(id);
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         AANKOMST: toTimeOnly(obj.AANKOMST) as unknown as Date,
         VERTREK: toTimeOnly(obj.VERTREK) as unknown as Date,
      };
   }

   @HeliosGetObjects(GetObjectsOperAanwezigLedenResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperAanwezigLedenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperAanwezigLedenResponse>>
   {
      this.logger.verbose(`AanwezigLedenController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigLeden.GetObjects');
      const objs = await this.AanwezigLedenService.GetObjects(queryParams);

      if (this.permissieService.isBeheerder(currentUser) || this.permissieService.isInstructeur(currentUser) || this.permissieService.isCIMT(currentUser))
      {
         const barometers = await this.AanwezigLedenService.GetStatusBarometers(objs.dataset);
         objs.dataset = objs.dataset.map(obj => ({...obj, STATUS_BAROMETER: barometers.get(obj.LID_ID)}));
      }

      return objs;
   }

   @HeliosCreateObject(CreateOperAanwezigLidDto, OperAanwezigLidDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperAanwezigLidDto): Promise<OperAanwezigLidDto>
   {
      this.logger.verbose(`AanwezigLedenController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'AanwezigLeden.AddObject');

      // DATUM en LID_ID zijn verplicht
      if (data.DATUM === undefined)
         throw new HttpException("Datum is verplicht", HttpStatus.BAD_REQUEST);
      if (data.LID_ID === undefined)
         throw new HttpException("LidID is verplicht", HttpStatus.BAD_REQUEST);

      return await this.AanwezigLedenService.AddObject(data);
   }

   @HeliosUpdateObject(UpdateOperAanwezigLidDto, OperAanwezigLidDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperAanwezigLidDto): Promise<OperAanwezigLidDto>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`AanwezigLedenController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigLeden.UpdateObject');
      return await this.AanwezigLedenService.UpdateObject(id, data);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`AanwezigLedenController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigLeden.DeleteObject');

      const data: Prisma.OperAanwezigLidUpdateInput = {
         VERWIJDERD: true
      }
      await this.AanwezigLedenService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`AanwezigLedenController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigLeden.RemoveObject');
      await this.AanwezigLedenService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`AanwezigLedenController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigLeden.RestoreObject');

      const data: Prisma.OperAanwezigLidUpdateInput = {
         VERWIJDERD: false
      }
      await this.AanwezigLedenService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}
