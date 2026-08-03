import {Body, Controller, Logger, Query} from '@nestjs/common';
import {TransactiesService} from "./transacties.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperTransactieDto} from "../../generated/nestjs-dto/operTransactie.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperTransactiesResponse} from "./GetObjectsOperTransactiesResponse";
import {GetObjectsOperTransactiesRequest} from "./GetObjectsOperTransactiesRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {ApiTags} from "@nestjs/swagger";
import {CreateOperTransactieDto} from "../../generated/nestjs-dto/create-operTransactie.dto";
import {UpdateOperTransactieDto} from "../../generated/nestjs-dto/update-operTransactie.dto";
import {safeStringify} from "../../core/helpers/LogHelper";

@Controller('Transacties')
@ApiTags('Transacties')
export class TransactiesController  extends HeliosController
{
   private readonly logger = new Logger(TransactiesController.name);

   constructor(private readonly TransactiesService: TransactiesService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperTransactieDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperTransactieDto>
   {
      this.logger.verbose(`TransactiesController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Transacties.GetObject');
      return await this.TransactiesService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperTransactiesResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperTransactiesRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperTransactiesResponse>>
   {
      this.logger.verbose(`TransactiesController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Transacties.GetObjects');
      return await this.TransactiesService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperTransactieDto, OperTransactieDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperTransactieDto): Promise<OperTransactieDto>
   {
      this.logger.verbose(`TransactiesController.AddObject(${safeStringify({currentUser, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Transacties.AddObject');
      return await this.TransactiesService.AddObject(data as Prisma.OperTransactieCreateInput);
   }

   @HeliosUpdateObject(UpdateOperTransactieDto, OperTransactieDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperTransactieDto): Promise<OperTransactieDto>
   {
      this.logger.verbose(`TransactiesController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Transacties.UpdateObject');
      return await this.TransactiesService.UpdateObject(id, data as Prisma.OperTransactieCreateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`TransactiesController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Transacties.DeleteObject');

      const data: Prisma.OperTransactieUpdateInput = {
         VERWIJDERD: true
      }
      await this.TransactiesService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`TransactiesController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Transacties.RemoveObject');
      await this.TransactiesService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`TransactiesController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Transacties.RestoreObject');

      const data: Prisma.OperTransactieUpdateInput = {
         VERWIJDERD: false
      }
      await this.TransactiesService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}
