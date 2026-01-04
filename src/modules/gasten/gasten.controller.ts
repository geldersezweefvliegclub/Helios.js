import {Body, Controller, Query} from '@nestjs/common';
import {ApiTags} from "@nestjs/swagger";
import {GastenService} from "./gasten.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperGastDto} from "../../generated/nestjs-dto/operGast.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperGastenResponse} from "./GetObjectsOperGastenResponse";
import {GetObjectsOperGastenRequest} from "./GetObjectsOperGastenRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperGastDto} from "../../generated/nestjs-dto/create-operGast.dto";
import {UpdateOperGastDto} from "../../generated/nestjs-dto/update-operGast.dto";

@Controller('Gasten')
@ApiTags('Gasten')
export class GastenController extends HeliosController
{
   constructor(private readonly GastenService: GastenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperGastDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<OperGastDto>
   {
      this.permissieService.heeftToegang(user, 'Gasten.GetObject');
      return await this.GastenService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperGastenResponse)
   GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsOperGastenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperGastenResponse>>
   {
      this.permissieService.heeftToegang(user, 'Gasten.GetObjects');
      return this.GastenService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperGastDto, OperGastDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateOperGastDto): Promise<OperGastDto>
   {
      this.permissieService.heeftToegang(user, 'Gasten.AddObject');
      return await this.GastenService.AddObject(data as Prisma.OperGastCreateInput);
   }

   @HeliosUpdateObject(UpdateOperGastDto, OperGastDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperGastDto): Promise<OperGastDto>
   {
      this.permissieService.heeftToegang(user, 'Gasten.UpdateObject');
      return await this.GastenService.UpdateObject(id, data as Prisma.OperGastCreateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Gasten.DeleteObject');

      const data: Prisma.OperGastUpdateInput = {
         VERWIJDERD: true
      }
      await this.GastenService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Gasten.RemoveObject');
      await this.GastenService.RemoveObject(id);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Gasten.RestoreObject');

      const data: Prisma.OperGastUpdateInput = {
         VERWIJDERD: false
      }
      await this.GastenService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}