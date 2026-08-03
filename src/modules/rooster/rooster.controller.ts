import {Body, Controller, Logger, Query} from '@nestjs/common';
import {RoosterService} from "./rooster.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperRoosterDto} from "../../generated/nestjs-dto/operRooster.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperRoosterResponse} from "./GetObjectsOperRoosterResponse";
import {GetObjectsOperRoosterRequest} from "./GetObjectsOperRoosterRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperRoosterDto} from "../../generated/nestjs-dto/create-operRooster.dto";
import {UpdateOperRoosterDto} from "../../generated/nestjs-dto/update-operRooster.dto";
import {ApiTags} from "@nestjs/swagger";
import {safeStringify} from "../../core/helpers/LogHelper";

@Controller('Rooster')
@ApiTags('Rooster')
export class RoosterController  extends HeliosController
{
   private readonly logger = new Logger(RoosterController.name);

   constructor(private readonly RoosterService: RoosterService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperRoosterDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperRoosterDto>
   {
      this.logger.verbose(`RoosterController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Rooster.GetObject');
      return await this.RoosterService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperRoosterResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperRoosterRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperRoosterResponse>>
   {
      this.logger.verbose(`RoosterController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Rooster.GetObjects');
      return await this.RoosterService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperRoosterDto, OperRoosterDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperRoosterDto): Promise<OperRoosterDto>
   {
      this.logger.verbose(`RoosterController.AddObject(${safeStringify({currentUser, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Rooster.AddObject');
      return await this.RoosterService.AddObject(data as Prisma.OperRoosterCreateInput);
   }

   @HeliosUpdateObject(UpdateOperRoosterDto, OperRoosterDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperRoosterDto): Promise<OperRoosterDto>
   {
      this.logger.verbose(`RoosterController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Rooster.UpdateObject');
      return await this.RoosterService.UpdateObject(id, data as Prisma.OperRoosterCreateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`RoosterController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Rooster.DeleteObject');

      const data: Prisma.OperRoosterUpdateInput = {
         VERWIJDERD: true
      }
      await this.RoosterService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`RoosterController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Rooster.RemoveObject');
      await this.RoosterService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`RoosterController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Rooster.RestoreObject');

      const data: Prisma.OperRoosterUpdateInput = {
         VERWIJDERD: false
      }
      await this.RoosterService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}