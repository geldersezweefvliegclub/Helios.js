
import {Body, Controller, Query} from '@nestjs/common';
import {DagInfoService} from "./dag-info.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperDagInfoDto} from "../../generated/nestjs-dto/operDagInfo.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperDagInfoResponse} from "./GetObjectsOperDagInfoResponse";
import {GetObjectsOperDagInfoRequest} from "./GetObjectsOperDagInfoRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperDagInfoDto} from "../../generated/nestjs-dto/create-operDagInfo.dto";
import {UpdateOperDagInfoDto} from "../../generated/nestjs-dto/update-operDagInfo.dto";
import {ApiTags} from "@nestjs/swagger";

@Controller('DagInfo')
@ApiTags('DagInfo')
export class DagInfoController  extends HeliosController
{
   constructor(private readonly DagInfoService: DagInfoService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperDagInfoDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<OperDagInfoDto>
   {
      this.permissieService.heeftToegang(user, 'DagInfo.GetObject');
      return await this.DagInfoService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperDagInfoResponse)
   GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsOperDagInfoRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperDagInfoResponse>>
   {
      this.permissieService.heeftToegang(user, 'DagInfo.GetObjects');
      return this.DagInfoService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperDagInfoDto, OperDagInfoDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateOperDagInfoDto): Promise<OperDagInfoDto>
   {
      this.permissieService.heeftToegang(user, 'DagInfo.AddObject');
      return await this.DagInfoService.AddObject(data as Prisma.OperDagInfoCreateInput);
   }

   @HeliosUpdateObject(UpdateOperDagInfoDto, OperDagInfoDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperDagInfoDto): Promise<OperDagInfoDto>
   {
      this.permissieService.heeftToegang(user, 'DagInfo.UpdateObject');
      return await this.DagInfoService.UpdateObject(id, data as Prisma.OperDagInfoCreateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'DagInfo.DeleteObject');

      const data: Prisma.OperDagInfoUpdateInput = {
         VERWIJDERD: true
      }
      await this.DagInfoService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'DagInfo.RemoveObject');
      await this.DagInfoService.RemoveObject(id);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'DagInfo.RestoreObject');

      const data: Prisma.OperDagInfoUpdateInput = {
         VERWIJDERD: false
      }
      await this.DagInfoService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}