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
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {parseDateOnly, toDateOnly} from "../../core/helpers/DateOnly";

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
      const obj = await this.TransactiesService.GetObject(id);
      return {...obj, VLIEGDAG: toDateOnly(obj.VLIEGDAG) as unknown as Date};
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
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'Transacties.AddObject');

      const insert = await this.normaliserenData(data) as Prisma.OperTransactieCreateInput;
      const obj = await this.TransactiesService.AddObject(insert, currentUser.ID);
      return {...obj, VLIEGDAG: toDateOnly(obj.VLIEGDAG) as unknown as Date};
   }

   @HeliosUpdateObject(UpdateOperTransactieDto, OperTransactieDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperTransactieDto): Promise<OperTransactieDto>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`TransactiesController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Transacties.UpdateObject');

      const update = await this.normaliserenData(data) as Prisma.OperTransactieUpdateInput;
      const obj = await this.TransactiesService.UpdateObject(id, update, currentUser.ID);
      return {...obj, VLIEGDAG: toDateOnly(obj.VLIEGDAG) as unknown as Date};
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden en normaliseert VLIEGDAG
   private async normaliserenData(
      data: CreateOperTransactieDto | UpdateOperTransactieDto): Promise<Prisma.OperTransactieCreateInput | Prisma.OperTransactieUpdateInput>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      // zorg dat VLIEGDAG omgezet wordt in ISO 8601 formaat
      data.VLIEGDAG = parseDateOnly(data.VLIEGDAG as Date | string | null);

      return data as Prisma.OperTransactieCreateInput | Prisma.OperTransactieUpdateInput;
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
      await this.TransactiesService.UpdateObject(id, data, currentUser.ID);
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
      await this.TransactiesService.UpdateObject(id, data, currentUser.ID);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}
