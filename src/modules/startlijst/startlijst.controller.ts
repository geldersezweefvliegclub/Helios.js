import {Body, Controller, Query} from '@nestjs/common';
import {StartlijstService} from "./startlijst.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperStartlijstDto} from "../../generated/nestjs-dto/operStartlijst.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperStartlijstResponse} from "./GetObjectsOperStartlijstResponse";
import {GetObjectsOperStartlijstRequest} from "./GetObjectsOperStartlijstRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperStartlijstDto} from "../../generated/nestjs-dto/create-operStartlijst.dto";
import {UpdateOperStartlijstDto} from "../../generated/nestjs-dto/update-operStartlijst.dto";
import {ApiTags} from "@nestjs/swagger";

@Controller('Startlijst')
@ApiTags('Startlijst')
export class StartlijstController extends HeliosController
{
   constructor(private readonly startlijstService: StartlijstService,
               private readonly permissieService: PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperStartlijstDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<OperStartlijstDto>
   {
      this.permissieService.heeftToegang(user, 'Startlijst.GetObject');
      return await this.startlijstService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperStartlijstResponse)
   GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsOperStartlijstRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperStartlijstResponse>>
   {
      this.permissieService.heeftToegang(user, 'Startlijst.GetObjects');
      return this.startlijstService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperStartlijstDto, OperStartlijstDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateOperStartlijstDto): Promise<OperStartlijstDto>
   {
      this.permissieService.heeftToegang(user, 'Startlijst.AddObject');
      return await this.startlijstService.AddObject(data as Prisma.OperStartlijstUncheckedCreateInput);
   }

   @HeliosUpdateObject(UpdateOperStartlijstDto, OperStartlijstDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperStartlijstDto): Promise<OperStartlijstDto>
   {
      this.permissieService.heeftToegang(user, 'Startlijst.UpdateObject');
      return await this.startlijstService.UpdateObject(id, data as Prisma.OperStartlijstUncheckedUpdateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Startlijst.DeleteObject');

      const data: Prisma.OperStartlijstUpdateInput = {
         VERWIJDERD: true
      }
      await this.startlijstService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Startlijst.RemoveObject');
      await this.startlijstService.RemoveObject(id);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Startlijst.RestoreObject');

      const data: Prisma.OperStartlijstUpdateInput = {
         VERWIJDERD: false
      }
      await this.startlijstService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

}