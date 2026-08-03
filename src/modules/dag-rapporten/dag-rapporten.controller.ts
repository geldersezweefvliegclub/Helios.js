import {Body, Controller, Logger, Query} from '@nestjs/common';
import {DagRapportenService} from "./dag-rapporten.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperDagRapportDto} from "../../generated/nestjs-dto/operDagRapport.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperDagRapportenResponse} from "./GetObjectsOperDagRapportenResponse";
import {GetObjectsOperDagRapportenRequest} from "./GetObjectsOperDagRapportenRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperDagRapportDto} from "../../generated/nestjs-dto/create-operDagRapport.dto";
import {UpdateOperDagRapportDto} from "../../generated/nestjs-dto/update-operDagRapport.dto";
import {ApiTags} from "@nestjs/swagger";
import {safeStringify} from "../../core/helpers/LogHelper";

@Controller('DagRapporten')
@ApiTags('DagRapporten')
export class DagRapportenController extends HeliosController
{
   private readonly logger = new Logger(DagRapportenController.name);

   constructor(private readonly DagRapportenService: DagRapportenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperDagRapportDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperDagRapportDto>
   {
      this.logger.verbose(`DagRapportenController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'DagRapporten.GetObject');
      return await this.DagRapportenService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperDagRapportenResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperDagRapportenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperDagRapportenResponse>>
   {
      this.logger.verbose(`DagRapportenController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'DagRapporten.GetObjects');
      return await this.DagRapportenService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperDagRapportDto, OperDagRapportDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperDagRapportDto): Promise<OperDagRapportDto>
   {
      this.logger.verbose(`DagRapportenController.AddObject(${safeStringify({currentUser, data})})`);
      this.permissieService.heeftToegang(currentUser, 'DagRapporten.AddObject');
      return await this.DagRapportenService.AddObject(data as Prisma.OperDagRapportCreateInput);
   }

   @HeliosUpdateObject(UpdateOperDagRapportDto, OperDagRapportDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperDagRapportDto): Promise<OperDagRapportDto>
   {
      this.logger.verbose(`DagRapportenController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'DagRapporten.UpdateObject');
      return await this.DagRapportenService.UpdateObject(id, data as Prisma.OperDagRapportCreateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DagRapportenController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'DagRapporten.DeleteObject');

      const data: Prisma.OperDagRapportUpdateInput = {
         VERWIJDERD: true
      }
      await this.DagRapportenService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DagRapportenController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'DagRapporten.RemoveObject');
      await this.DagRapportenService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DagRapportenController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'DagRapporten.RestoreObject');

      const data: Prisma.OperDagRapportUpdateInput = {
         VERWIJDERD: false
      }
      await this.DagRapportenService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}
