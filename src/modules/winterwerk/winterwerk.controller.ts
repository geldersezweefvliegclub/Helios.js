
import {Body, Controller, Query} from '@nestjs/common';
import {ApiTags} from "@nestjs/swagger";
import {WinterwerkService} from "./winterwerk.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperWinterwerkDto} from "../../generated/nestjs-dto/operWinterwerk.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperWinterwerkResponse} from "./GetObjectsOperWinterwerkResponse";
import {GetObjectsOperWinterwerkRequest} from "./GetObjectsOperWinterwerkRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperWinterwerkDto} from "../../generated/nestjs-dto/create-operWinterwerk.dto";
import {UpdateOperWinterwerkDto} from "../../generated/nestjs-dto/update-operWinterwerk.dto";

@Controller('Winterwerk')
@ApiTags('Winterwerk')
export class WinterwerkController extends HeliosController
{
   constructor(private readonly WinterwerkService: WinterwerkService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperWinterwerkDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<OperWinterwerkDto>
   {
      this.permissieService.heeftToegang(user, 'Winterwerk.GetObject');
      return await this.WinterwerkService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperWinterwerkResponse)
   GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsOperWinterwerkRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperWinterwerkResponse>>
   {
      this.permissieService.heeftToegang(user, 'Winterwerk.GetObjects');
      return this.WinterwerkService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperWinterwerkDto, OperWinterwerkDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateOperWinterwerkDto): Promise<OperWinterwerkDto>
   {
      this.permissieService.heeftToegang(user, 'Winterwerk.AddObject');
      return await this.WinterwerkService.AddObject(data as Prisma.OperWinterwerkCreateInput);
   }

   @HeliosUpdateObject(UpdateOperWinterwerkDto, OperWinterwerkDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperWinterwerkDto): Promise<OperWinterwerkDto>
   {
      this.permissieService.heeftToegang(user, 'Winterwerk.UpdateObject');
      return await this.WinterwerkService.UpdateObject(id, data as Prisma.OperWinterwerkCreateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Winterwerk.DeleteObject');

      const data: Prisma.OperWinterwerkUpdateInput = {
         VERWIJDERD: true
      }
      await this.WinterwerkService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Winterwerk.RemoveObject');
      await this.WinterwerkService.RemoveObject(id);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Winterwerk.RestoreObject');

      const data: Prisma.OperWinterwerkUpdateInput = {
         VERWIJDERD: false
      }
      await this.WinterwerkService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}