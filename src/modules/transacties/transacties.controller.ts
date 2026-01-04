import {Body, Controller, Query} from '@nestjs/common';
import {TransactiesService} from "./transacties.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperTransactieDto} from "../../generated/nestjs-dto/OperTransactie.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperTransactiesResponse} from "./GetObjectsOperTransactiesResponse";
import {GetObjectsOperTransactiesRequest} from "./GetObjectsOperTransactiesRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {ApiTags} from "@nestjs/swagger";
import {CreateOperTransactieDto} from "../../generated/nestjs-dto/create-operTransactie.dto";
import {UpdateOperTransactieDto} from "../../generated/nestjs-dto/update-operTransactie.dto";

@Controller('Transacties')
@ApiTags('Transacties')
export class TransactiesController  extends HeliosController
{
   constructor(private readonly TransactiesService: TransactiesService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperTransactieDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<OperTransactieDto>
   {
      this.permissieService.heeftToegang(user, 'Transacties.GetObject');
      return await this.TransactiesService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperTransactiesResponse)
   GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsOperTransactiesRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperTransactiesResponse>>
   {
      this.permissieService.heeftToegang(user, 'Transacties.GetObjects');
      return this.TransactiesService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperTransactieDto, OperTransactieDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateOperTransactieDto): Promise<OperTransactieDto>
   {
      this.permissieService.heeftToegang(user, 'Transacties.AddObject');
      return await this.TransactiesService.AddObject(data as Prisma.OperTransactieCreateInput);
   }

   @HeliosUpdateObject(UpdateOperTransactieDto, OperTransactieDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperTransactieDto): Promise<OperTransactieDto>
   {
      this.permissieService.heeftToegang(user, 'Transacties.UpdateObject');
      return await this.TransactiesService.UpdateObject(id, data as Prisma.OperTransactieCreateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Transacties.DeleteObject');

      const data: Prisma.OperTransactieUpdateInput = {
         VERWIJDERD: true
      }
      await this.TransactiesService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Transacties.RemoveObject');
      await this.TransactiesService.RemoveObject(id);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Transacties.RestoreObject');

      const data: Prisma.OperTransactieUpdateInput = {
         VERWIJDERD: false
      }
      await this.TransactiesService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}
