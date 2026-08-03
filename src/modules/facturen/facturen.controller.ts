import {Body, Controller, Logger, Query} from '@nestjs/common';
import {FacturenService} from "./facturen.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperFactuurDto} from "../../generated/nestjs-dto/operFactuur.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperFacturenResponse} from "./GetObjectsOperFacturenResponse";
import {GetObjectsOperFacturenRequest} from "./GetObjectsOperFacturenRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperFactuurDto} from "../../generated/nestjs-dto/create-operFactuur.dto";
import {UpdateOperFactuurDto} from "../../generated/nestjs-dto/update-operFactuur.dto";
import {ApiTags} from "@nestjs/swagger";
import {safeStringify} from "../../core/helpers/LogHelper";

@Controller('Facturen')
@ApiTags('Facturen')
export class FacturenController  extends HeliosController
{
   private readonly logger = new Logger(FacturenController.name);

   constructor(private readonly FacturenService: FacturenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperFactuurDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperFactuurDto>
   {
      this.logger.verbose(`FacturenController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Facturen.GetObject');
      return await this.FacturenService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperFacturenResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperFacturenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperFacturenResponse>>
   {
      this.logger.verbose(`FacturenController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Facturen.GetObjects');
      return await this.FacturenService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperFactuurDto, OperFactuurDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperFactuurDto): Promise<OperFactuurDto>
   {
      this.logger.verbose(`FacturenController.AddObject(${safeStringify({currentUser, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Facturen.AddObject');
      return await this.FacturenService.AddObject(data as Prisma.OperFactuurCreateInput);
   }

   @HeliosUpdateObject(UpdateOperFactuurDto, OperFactuurDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperFactuurDto): Promise<OperFactuurDto>
   {
      this.logger.verbose(`FacturenController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Facturen.UpdateObject');
      return await this.FacturenService.UpdateObject(id, data as Prisma.OperFactuurCreateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`FacturenController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Facturen.DeleteObject');

      const data: Prisma.OperFactuurUpdateInput = {
         VERWIJDERD: true
      }
      await this.FacturenService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`FacturenController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Facturen.RemoveObject');
      await this.FacturenService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`FacturenController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Facturen.RestoreObject');

      const data: Prisma.OperFactuurUpdateInput = {
         VERWIJDERD: false
      }
      await this.FacturenService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}