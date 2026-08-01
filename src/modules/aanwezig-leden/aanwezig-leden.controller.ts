import {Body, Controller, HttpException, HttpStatus, Query} from '@nestjs/common';
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

@Controller('AanwezigLeden')
@ApiTags('AanwezigLeden')
export class AanwezigLedenController  extends HeliosController
{
   constructor(private readonly AanwezigLedenService: AanwezigLedenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperAanwezigLidDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<OperAanwezigLidDto>
   {
      this.permissieService.heeftToegang(user, 'AanwezigLeden.GetObject');
      return await this.AanwezigLedenService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperAanwezigLedenResponse)
   async GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsOperAanwezigLedenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperAanwezigLedenResponse>>
   {
      this.permissieService.heeftToegang(user, 'AanwezigLeden.GetObjects');
      const objs = await this.AanwezigLedenService.GetObjects(queryParams);

      if (this.permissieService.isBeheerder(user) || this.permissieService.isInstructeur(user) || this.permissieService.isCIMT(user))
      {
         const barometers = await this.AanwezigLedenService.GetStatusBarometers(objs.dataset);
         objs.dataset = objs.dataset.map(obj => ({...obj, STATUS_BAROMETER: barometers.get(obj.LID_ID)}));
      }

      return objs;
   }

   @HeliosCreateObject(CreateOperAanwezigLidDto, OperAanwezigLidDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateOperAanwezigLidDto): Promise<OperAanwezigLidDto>
   {
      this.permissieService.heeftToegang(user, 'AanwezigLeden.AddObject');

      // DATUM en LID_ID zijn verplicht
      if (data.DATUM === undefined)
         throw new HttpException("Datum is verplicht", HttpStatus.BAD_REQUEST);
      if (data.LID_ID === undefined)
         throw new HttpException("LidID is verplicht", HttpStatus.BAD_REQUEST);

      return await this.AanwezigLedenService.AddObject(data);
   }

   @HeliosUpdateObject(UpdateOperAanwezigLidDto, OperAanwezigLidDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperAanwezigLidDto): Promise<OperAanwezigLidDto>
   {
      this.permissieService.heeftToegang(user, 'AanwezigLeden.UpdateObject');
      return await this.AanwezigLedenService.UpdateObject(id, data);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'AanwezigLeden.DeleteObject');

      const data: Prisma.OperAanwezigLidUpdateInput = {
         VERWIJDERD: true
      }
      await this.AanwezigLedenService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'AanwezigLeden.RemoveObject');
      await this.AanwezigLedenService.RemoveObject(id);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'AanwezigLeden.RestoreObject');

      const data: Prisma.OperAanwezigLidUpdateInput = {
         VERWIJDERD: false
      }
      await this.AanwezigLedenService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}
