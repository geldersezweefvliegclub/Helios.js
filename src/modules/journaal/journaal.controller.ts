import {Body, Controller, Logger, Query} from '@nestjs/common';
import {
   HeliosController,
   HeliosCreateObject,
   HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects,
   HeliosRemoveObject,
   HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {PermissieService} from "../authorisatie/permissie.service";
import {CurrentUser} from "../login/current-user.decorator";
import {OperJournaal, Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperJournaalResponse} from "./GetObjectsOperJournaalResponse";
import {GetObjectsOperJournaalRequest} from "./GetObjectsOperJournaalRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {JournaalService} from "./journaal.service";
import {ApiTags} from "@nestjs/swagger";
import {OperJournaalDto} from "../../generated/nestjs-dto/operJournaal.dto";
import {CreateOperJournaalDto} from "../../generated/nestjs-dto/create-operJournaal.dto";
import {UpdateOperJournaalDto} from "../../generated/nestjs-dto/update-operJournaal.dto";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";

@Controller('Journaal')
@ApiTags('Journaal')
export class JournaalController extends HeliosController
{
   private readonly logger = new Logger(JournaalController.name);

   constructor(private readonly journaalService: JournaalService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperJournaalDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperJournaalDto>
   {
      this.logger.verbose(`JournaalController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Journaal.GetObject');
      return await this.journaalService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperJournaalResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperJournaalRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperJournaalResponse>>
   {
      this.logger.verbose(`JournaalController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Journaal.GetObjects');
      return await this.journaalService.GetObjects (queryParams);
   }

   @HeliosCreateObject(CreateOperJournaalDto, OperJournaalDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperJournaalDto): Promise<OperJournaalDto>
   {
      this.logger.verbose(`JournaalController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'Journaal.AddObject');

      const insert = await this.normaliserenData(data) as Prisma.OperJournaalUncheckedCreateInput;
      return await this.journaalService.AddObject(insert, currentUser.ID);
   }

   @HeliosUpdateObject(UpdateOperJournaalDto, OperJournaalDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperJournaalDto): Promise<OperJournaal>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`JournaalController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Journaal.UpdateObject');

      const update = await this.normaliserenData(data) as Prisma.OperJournaalUncheckedUpdateInput;
      return await this.journaalService.UpdateObject(id, update, currentUser.ID);
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden.
   // MELDER_ID, TECHNICUS_ID, AFGETEKEND_ID, CATEGORIE_ID, STATUS_ID, ROLLEND_ID en VLIEGTUIG_ID hoeven niet
   // omgezet te worden naar relatie-connects: met het Unchecked Prisma inputtype zijn dit al platte, nullable
   // kolommen, dus een meegegeven null zet de relatie direct los (zowel bij create als update) zonder aparte afhandeling
   private async normaliserenData(
      data: CreateOperJournaalDto | UpdateOperJournaalDto): Promise<Prisma.OperJournaalUncheckedCreateInput | Prisma.OperJournaalUncheckedUpdateInput>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      return data as Prisma.OperJournaalUncheckedCreateInput | Prisma.OperJournaalUncheckedUpdateInput;
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`JournaalController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Journaal.DeleteObject');

      const data: Prisma.OperJournaalUncheckedUpdateInput = {
         VERWIJDERD: true
      }
      await this.journaalService.UpdateObject(id, data, currentUser.ID);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`JournaalController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Journaal.RemoveObject');
      await this.journaalService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`JournaalController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Journaal.RestoreObject');

      const data: Prisma.OperJournaalUncheckedUpdateInput = {
         VERWIJDERD: false
      }
      await this.journaalService.UpdateObject(id, data, currentUser.ID);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//
   
}
