import {Body, Controller, Logger, Query} from '@nestjs/common';
import {ApiTags} from "@nestjs/swagger";
import {GastenService} from "./gasten.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperGastDto} from "../../generated/nestjs-dto/operGast.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperGastenResponse} from "./GetObjectsOperGastenResponse";
import {GetObjectsOperGastenRequest} from "./GetObjectsOperGastenRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperGastDto} from "../../generated/nestjs-dto/create-operGast.dto";
import {UpdateOperGastDto} from "../../generated/nestjs-dto/update-operGast.dto";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {toDateOnly} from "../../core/helpers/DateOnly";

@Controller('Gasten')
@ApiTags('Gasten')
export class GastenController extends HeliosController
{
   private readonly logger = new Logger(GastenController.name);

   constructor(private readonly GastenService: GastenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperGastDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperGastDto>
   {
      this.logger.verbose(`GastenController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Gasten.GetObject');
      const obj = await this.GastenService.GetObject(id);
      return {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
   }

   @HeliosGetObjects(GetObjectsOperGastenResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperGastenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperGastenResponse>>
   {
      this.logger.verbose(`GastenController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Gasten.GetObjects');
      return await this.GastenService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperGastDto, OperGastDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperGastDto): Promise<OperGastDto>
   {
      this.logger.verbose(`GastenController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'Gasten.AddObject');
      return await this.GastenService.AddObject(data as Prisma.OperGastCreateInput);
   }

   @HeliosUpdateObject(UpdateOperGastDto, OperGastDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperGastDto): Promise<OperGastDto>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`GastenController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Gasten.UpdateObject');
      return await this.GastenService.UpdateObject(id, data as Prisma.OperGastCreateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`GastenController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Gasten.DeleteObject');

      const data: Prisma.OperGastUpdateInput = {
         VERWIJDERD: true
      }
      await this.GastenService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`GastenController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Gasten.RemoveObject');
      await this.GastenService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`GastenController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Gasten.RestoreObject');

      const data: Prisma.OperGastUpdateInput = {
         VERWIJDERD: false
      }
      await this.GastenService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}