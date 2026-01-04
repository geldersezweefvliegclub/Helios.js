import {Body, Controller, Query} from '@nestjs/common';
import {FacturenService} from "./facturen.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperFactuurDto} from "../../generated/nestjs-dto/OperFactuur.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperFacturenResponse} from "./GetObjectsOperFacturenResponse";
import {GetObjectsOperFacturenRequest} from "./GetObjectsOperFacturenRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperFactuurDto} from "../../generated/nestjs-dto/create-OperFactuur.dto";
import {UpdateOperFactuurDto} from "../../generated/nestjs-dto/update-OperFactuur.dto";
import {ApiTags} from "@nestjs/swagger";

@Controller('Facturen')
@ApiTags('Facturen')
export class FacturenController  extends HeliosController
{
   constructor(private readonly FacturenService: FacturenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperFactuurDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<OperFactuurDto>
   {
      this.permissieService.heeftToegang(user, 'Facturen.GetObject');
      return await this.FacturenService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperFacturenResponse)
   GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsOperFacturenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperFacturenResponse>>
   {
      this.permissieService.heeftToegang(user, 'Facturen.GetObjects');
      return this.FacturenService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperFactuurDto, OperFactuurDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateOperFactuurDto): Promise<OperFactuurDto>
   {
      this.permissieService.heeftToegang(user, 'Facturen.AddObject');
      return await this.FacturenService.AddObject(data as Prisma.OperFactuurCreateInput);
   }

   @HeliosUpdateObject(UpdateOperFactuurDto, OperFactuurDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperFactuurDto): Promise<OperFactuurDto>
   {
      this.permissieService.heeftToegang(user, 'Facturen.UpdateObject');
      return await this.FacturenService.UpdateObject(id, data as Prisma.OperFactuurCreateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Facturen.DeleteObject');

      const data: Prisma.OperFactuurUpdateInput = {
         VERWIJDERD: true
      }
      await this.FacturenService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Facturen.RemoveObject');
      await this.FacturenService.RemoveObject(id);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Facturen.RestoreObject');

      const data: Prisma.OperFactuurUpdateInput = {
         VERWIJDERD: false
      }
      await this.FacturenService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}