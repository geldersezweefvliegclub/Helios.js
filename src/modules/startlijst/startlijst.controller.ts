import {Body, Controller, Logger, Query} from '@nestjs/common';
import {StartlijstService} from "./startlijst.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperStartlijstDto} from "../../generated/nestjs-dto/operStartlijst.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperStartlijstResponse} from "./GetObjectsOperStartlijstResponse";
import {GetObjectsOperStartlijstRequest} from "./GetObjectsOperStartlijstRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperStartlijstDto} from "../../generated/nestjs-dto/create-operStartlijst.dto";
import {UpdateOperStartlijstDto} from "../../generated/nestjs-dto/update-operStartlijst.dto";
import {ApiTags} from "@nestjs/swagger";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {toDateOnly, toTimeOnly} from "../../core/helpers/DateOnly";

@Controller('Startlijst')
@ApiTags('Startlijst')
export class StartlijstController extends HeliosController
{
   private readonly logger = new Logger(StartlijstController.name);

   constructor(private readonly startlijstService: StartlijstService,
               private readonly permissieService: PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperStartlijstDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperStartlijstDto>
   {
      this.logger.verbose(`StartlijstController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.GetObject');
      const obj = await this.startlijstService.GetObject(id);
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         STARTTIJD: toTimeOnly(obj.STARTTIJD) as unknown as Date,
         LANDINGSTIJD: toTimeOnly(obj.LANDINGSTIJD) as unknown as Date,
      };
   }

   @HeliosGetObjects(GetObjectsOperStartlijstResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperStartlijstRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperStartlijstResponse>>
   {
      this.logger.verbose(`StartlijstController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.GetObjects');
      return await this.startlijstService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperStartlijstDto, OperStartlijstDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperStartlijstDto): Promise<OperStartlijstDto>
   {
      this.logger.verbose(`StartlijstController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.AddObject');
      return await this.startlijstService.AddObject(data as Prisma.OperStartlijstUncheckedCreateInput);
   }

   @HeliosUpdateObject(UpdateOperStartlijstDto, OperStartlijstDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperStartlijstDto): Promise<OperStartlijstDto>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`StartlijstController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.UpdateObject');
      return await this.startlijstService.UpdateObject(id, data as Prisma.OperStartlijstUncheckedUpdateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`StartlijstController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.DeleteObject');

      const data: Prisma.OperStartlijstUpdateInput = {
         VERWIJDERD: true
      }
      await this.startlijstService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`StartlijstController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.RemoveObject');
      await this.startlijstService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`StartlijstController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Startlijst.RestoreObject');

      const data: Prisma.OperStartlijstUpdateInput = {
         VERWIJDERD: false
      }
      await this.startlijstService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

}