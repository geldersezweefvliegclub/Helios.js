import {Body, Controller, Query} from '@nestjs/common';
import {RoosterService} from "./rooster.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperRoosterDto} from "../../generated/nestjs-dto/OperRooster.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperRoosterResponse} from "./GetObjectsOperRoosterResponse";
import {GetObjectsOperRoosterRequest} from "./GetObjectsOperRoosterRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperRoosterDto} from "../../generated/nestjs-dto/create-OperRooster.dto";
import {UpdateOperRoosterDto} from "../../generated/nestjs-dto/update-OperRooster.dto";
import {ApiTags} from "@nestjs/swagger";

@Controller('Rooster')
@ApiTags('Rooster')
export class RoosterController  extends HeliosController
{
   constructor(private readonly RoosterService: RoosterService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperRoosterDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<OperRoosterDto>
   {
      this.permissieService.heeftToegang(user, 'Rooster.GetObject');
      return await this.RoosterService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperRoosterResponse)
   GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsOperRoosterRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperRoosterResponse>>
   {
      this.permissieService.heeftToegang(user, 'Rooster.GetObjects');
      return this.RoosterService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperRoosterDto, OperRoosterDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateOperRoosterDto): Promise<OperRoosterDto>
   {
      this.permissieService.heeftToegang(user, 'Rooster.AddObject');
      return await this.RoosterService.AddObject(data as Prisma.OperRoosterCreateInput);
   }

   @HeliosUpdateObject(UpdateOperRoosterDto, OperRoosterDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperRoosterDto): Promise<OperRoosterDto>
   {
      this.permissieService.heeftToegang(user, 'Rooster.UpdateObject');
      return await this.RoosterService.UpdateObject(id, data as Prisma.OperRoosterCreateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Rooster.DeleteObject');

      const data: Prisma.OperRoosterUpdateInput = {
         VERWIJDERD: true
      }
      await this.RoosterService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Rooster.RemoveObject');
      await this.RoosterService.RemoveObject(id);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Rooster.RestoreObject');

      const data: Prisma.OperRoosterUpdateInput = {
         VERWIJDERD: false
      }
      await this.RoosterService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}