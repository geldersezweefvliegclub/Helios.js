import {Body, Controller, Query} from '@nestjs/common';
import {DagRapportenService} from "./dag-rapporten.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperDagRapportDto} from "../../generated/nestjs-dto/OperDagRapport.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperDagRapportenResponse} from "./GetObjectsOperDagRapportenResponse";
import {GetObjectsOperDagRapportenRequest} from "./GetObjectsOperDagRapportenRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperDagRapportDto} from "../../generated/nestjs-dto/create-OperDagRapport.dto";
import {UpdateOperDagRapportDto} from "../../generated/nestjs-dto/update-OperDagRapport.dto";

@Controller('DagInfo')
@Controller('dagInfo')
export class DagInfoController  extends HeliosController
{
   constructor(private readonly DagInfoService: DagRapportenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperDagRapportDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<OperDagRapportDto>
   {
      this.permissieService.heeftToegang(user, 'DagInfo.GetObject');
      return await this.DagInfoService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperDagRapportenResponse)
   GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsOperDagRapportenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperDagRapportenResponse>>
   {
      this.permissieService.heeftToegang(user, 'DagInfo.GetObjects');
      return this.DagInfoService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperDagRapportDto, OperDagRapportDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateOperDagRapportDto): Promise<OperDagRapportDto>
   {
      this.permissieService.heeftToegang(user, 'DagInfo.AddObject');
      return await this.DagInfoService.AddObject(data as Prisma.OperDagRapportCreateInput);
   }

   @HeliosUpdateObject(UpdateOperDagRapportDto, OperDagRapportDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperDagRapportDto): Promise<OperDagRapportDto>
   {
      this.permissieService.heeftToegang(user, 'DagInfo.UpdateObject');
      return await this.DagInfoService.UpdateObject(id, data as Prisma.OperWinterwerkCreateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'DagInfo.DeleteObject');

      const data: Prisma.OperWinterwerkUpdateInput = {
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

      const data: Prisma.OperWinterwerkUpdateInput = {
         VERWIJDERD: false
      }
      await this.DagInfoService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}