
import {Body, Controller, Logger, Query} from '@nestjs/common';
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
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {toDateOnly, toTimeOnly} from "../../core/helpers/DateOnly";

@Controller('Winterwerk')
@ApiTags('Winterwerk')
export class WinterwerkController extends HeliosController
{
   private readonly logger = new Logger(WinterwerkController.name);

   constructor(private readonly WinterwerkService: WinterwerkService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperWinterwerkDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperWinterwerkDto>
   {
      this.logger.verbose(`WinterwerkController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Winterwerk.GetObject');
      const obj = await this.WinterwerkService.GetObject(id);
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         AANVANG: toTimeOnly(obj.AANVANG) as unknown as Date,
         EINDE: toTimeOnly(obj.EINDE) as unknown as Date,
      };
   }

   @HeliosGetObjects(GetObjectsOperWinterwerkResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperWinterwerkRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperWinterwerkResponse>>
   {
      this.logger.verbose(`WinterwerkController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Winterwerk.GetObjects');
      return await this.WinterwerkService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperWinterwerkDto, OperWinterwerkDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperWinterwerkDto): Promise<OperWinterwerkDto>
   {
      this.logger.verbose(`WinterwerkController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'Winterwerk.AddObject');
      return await this.WinterwerkService.AddObject(data as Prisma.OperWinterwerkCreateInput);
   }

   @HeliosUpdateObject(UpdateOperWinterwerkDto, OperWinterwerkDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperWinterwerkDto): Promise<OperWinterwerkDto>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`WinterwerkController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Winterwerk.UpdateObject');
      return await this.WinterwerkService.UpdateObject(id, data as Prisma.OperWinterwerkCreateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`WinterwerkController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Winterwerk.DeleteObject');

      const data: Prisma.OperWinterwerkUpdateInput = {
         VERWIJDERD: true
      }
      await this.WinterwerkService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`WinterwerkController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Winterwerk.RemoveObject');
      await this.WinterwerkService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`WinterwerkController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Winterwerk.RestoreObject');

      const data: Prisma.OperWinterwerkUpdateInput = {
         VERWIJDERD: false
      }
      await this.WinterwerkService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}