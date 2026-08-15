
import {Body, Controller, Logger, Query} from '@nestjs/common';
import {DagInfoService} from "./dag-info.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperDagInfoDto} from "../../generated/nestjs-dto/operDagInfo.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperDagInfoResponse} from "./GetObjectsOperDagInfoResponse";
import {GetObjectsOperDagInfoRequest} from "./GetObjectsOperDagInfoRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperDagInfoDto} from "../../generated/nestjs-dto/create-operDagInfo.dto";
import {UpdateOperDagInfoDto} from "../../generated/nestjs-dto/update-operDagInfo.dto";
import {ApiTags} from "@nestjs/swagger";
import {GetObjectOperDagInfoRequest} from "./GetObjectOperDagInfoRequest";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {parseDateOnly, toDateOnly} from "../../core/helpers/DateOnly";

@Controller('Daginfo')
@ApiTags('Daginfo')
export class DagInfoController  extends HeliosController
{
   private readonly logger = new Logger(DagInfoController.name);

   constructor(private readonly DagInfoService: DagInfoService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperDagInfoDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query() params: GetObjectOperDagInfoRequest
   ): Promise<OperDagInfoDto>
   {
      this.logger.verbose(`DagInfoController.GetObject(${safeStringify({currentUser, params})})`);
      this.permissieService.heeftToegang(currentUser, 'DagInfo.GetObject');
      const obj = await this.DagInfoService.GetObject(params.ID, params.DATUM);
      return {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
   }

   @HeliosGetObjects(GetObjectsOperDagInfoResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperDagInfoRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperDagInfoResponse>>
   {
      this.logger.verbose(`DagInfoController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'DagInfo.GetObjects');
      return await this.DagInfoService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperDagInfoDto, OperDagInfoDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperDagInfoDto): Promise<OperDagInfoDto>
   {
      this.logger.verbose(`DagInfoController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'DagInfo.AddObject');

      const insert = await this.normaliserenData(data) as Prisma.OperDagInfoCreateInput;
      const obj = await this.DagInfoService.AddObject(insert, currentUser.ID);
      return {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
   }

   @HeliosUpdateObject(UpdateOperDagInfoDto, OperDagInfoDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperDagInfoDto): Promise<OperDagInfoDto>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`DagInfoController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'DagInfo.UpdateObject');

      const update = await this.normaliserenData(data) as Prisma.OperDagInfoUpdateInput;
      const obj = await this.DagInfoService.UpdateObject(id, update, currentUser.ID);
      return {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden en
   // normaliseert het datumveld
   private async normaliserenData(
      data: CreateOperDagInfoDto | UpdateOperDagInfoDto): Promise<Prisma.OperDagInfoCreateInput | Prisma.OperDagInfoUpdateInput>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      // zorg dat de datum omgezet wordt in ISO 8601 formaat
      data.DATUM = parseDateOnly(data.DATUM as Date | string) as Date;

      return data as Prisma.OperDagInfoCreateInput | Prisma.OperDagInfoUpdateInput;
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DagInfoController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'DagInfo.DeleteObject');

      const data: Prisma.OperDagInfoUpdateInput = {
         VERWIJDERD: true
      }
      await this.DagInfoService.UpdateObject(id, data, currentUser.ID);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DagInfoController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'DagInfo.RemoveObject');
      await this.DagInfoService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DagInfoController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'DagInfo.RestoreObject');

      const data: Prisma.OperDagInfoUpdateInput = {
         VERWIJDERD: false
      }
      await this.DagInfoService.UpdateObject(id, data, currentUser.ID);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}
