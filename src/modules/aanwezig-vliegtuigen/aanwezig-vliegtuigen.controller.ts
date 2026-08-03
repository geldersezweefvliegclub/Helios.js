import {Body, Controller, Logger, Query} from '@nestjs/common';
import {AanwezigVliegtuigenService} from "./aanwezig-vliegtuigen.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperAanwezigVliegtuigDto} from "../../generated/nestjs-dto/operAanwezigVliegtuig.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperAanwezigVliegtuigenResponse} from "./GetObjectsOperAanwezigVliegtuigenResponse";
import {GetObjectsOperAanwezigVliegtuigenRequest} from "./GetObjectsOperAanwezigVliegtuigenRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperAanwezigVliegtuigDto} from "../../generated/nestjs-dto/create-operAanwezigVliegtuig.dto";
import {UpdateOperAanwezigVliegtuigDto} from "../../generated/nestjs-dto/update-operAanwezigVliegtuig.dto";
import {ApiTags} from "@nestjs/swagger";
import {safeStringify} from "../../core/helpers/LogHelper";

@Controller('AanwezigVliegtuigen')
@ApiTags('AanwezigVliegtuigen')
export class AanwezigVliegtuigenController  extends HeliosController
{
   private readonly logger = new Logger(AanwezigVliegtuigenController.name);

   constructor(private readonly AanwezigVliegtuigenService: AanwezigVliegtuigenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperAanwezigVliegtuigDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperAanwezigVliegtuigDto>
   {
      this.logger.verbose(`AanwezigVliegtuigenController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigVliegtuigen.GetObject');
      return await this.AanwezigVliegtuigenService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperAanwezigVliegtuigenResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperAanwezigVliegtuigenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperAanwezigVliegtuigenResponse>>
   {
      this.logger.verbose(`AanwezigVliegtuigenController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigVliegtuigen.GetObjects');
      return await this.AanwezigVliegtuigenService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperAanwezigVliegtuigDto, OperAanwezigVliegtuigDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperAanwezigVliegtuigDto): Promise<OperAanwezigVliegtuigDto>
   {
      this.logger.verbose(`AanwezigVliegtuigenController.AddObject(${safeStringify({currentUser, data})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigVliegtuigen.AddObject');
      return await this.AanwezigVliegtuigenService.AddObject(data as Prisma.OperAanwezigVliegtuigCreateInput);
   }

   @HeliosUpdateObject(UpdateOperAanwezigVliegtuigDto, OperAanwezigVliegtuigDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperAanwezigVliegtuigDto): Promise<OperAanwezigVliegtuigDto>
   {
      this.logger.verbose(`AanwezigVliegtuigenController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigVliegtuigen.UpdateObject');
      return await this.AanwezigVliegtuigenService.UpdateObject(id, data as Prisma.OperAanwezigVliegtuigCreateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`AanwezigVliegtuigenController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigVliegtuigen.DeleteObject');

      const data: Prisma.OperAanwezigVliegtuigUpdateInput = {
         VERWIJDERD: true
      }
      await this.AanwezigVliegtuigenService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`AanwezigVliegtuigenController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigVliegtuigen.RemoveObject');
      await this.AanwezigVliegtuigenService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`AanwezigVliegtuigenController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'AanwezigVliegtuigen.RestoreObject');

      const data: Prisma.OperAanwezigVliegtuigUpdateInput = {
         VERWIJDERD: false
      }
      await this.AanwezigVliegtuigenService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}