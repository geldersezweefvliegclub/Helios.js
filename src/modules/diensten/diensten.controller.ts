import {Body, Controller, Query} from '@nestjs/common';
import {DienstenService} from "./diensten.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject,
   HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects,
   HeliosRemoveObject,
   HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetOperDienstenResponse} from "./GetOperDienstenResponse";
import {GetObjectsOperDienstenRequest} from "./GetObjectsOperDienstenRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperDienstDto} from "../../generated/nestjs-dto-test/create-OperDienst.dto";
import {UpdateOperDienstDto} from "../../generated/nestjs-dto-test/update-OperDienst.dto";
import {ApiTags} from "@nestjs/swagger";

@Controller('Diensten')
@ApiTags('Diensten')
export class DienstenController  extends HeliosController
{
   constructor(private readonly DienstenService: DienstenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(GetOperDienstenResponse)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<GetOperDienstenResponse>
   {
      this.permissieService.heeftToegang(user, 'Diensten.GetObject');
      return await this.DienstenService.GetObject(id);
   }

   @HeliosGetObjects(GetOperDienstenResponse)
   GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsOperDienstenRequest): Promise<IHeliosGetObjectsResponse<GetOperDienstenResponse>>
   {
      this.permissieService.heeftToegang(user, 'Diensten.GetObjects');
      return this.DienstenService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperDienstDto, GetOperDienstenResponse)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateOperDienstDto): Promise<GetOperDienstenResponse>
   {
      this.permissieService.heeftToegang(user, 'Diensten.AddObject');
      return await this.DienstenService.AddObject(data as Prisma.OperDienstCreateInput);
   }

   @HeliosUpdateObject(UpdateOperDienstDto, GetOperDienstenResponse)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperDienstDto): Promise<GetOperDienstenResponse>
   {
      this.permissieService.heeftToegang(user, 'Diensten.UpdateObject');
      return await this.DienstenService.UpdateObject(id, data as Prisma.OperDienstCreateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Diensten.DeleteObject');

      const data: Prisma.OperDienstUpdateInput = {
         VERWIJDERD: true
      }
      await this.DienstenService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Diensten.RemoveObject');
      await this.DienstenService.RemoveObject(id);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Diensten.RestoreObject');

      const data: Prisma.OperDienstUpdateInput = {
         VERWIJDERD: false
      }
      await this.DienstenService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}