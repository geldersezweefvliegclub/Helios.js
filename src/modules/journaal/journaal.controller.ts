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
      this.heeftDataToegangGetObject(currentUser);
      return await this.journaalService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperJournaalResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperJournaalRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperJournaalResponse>>
   {
      this.logger.verbose(`JournaalController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Journaal.GetObjects');
      this.heeftDataToegangGetObjects(currentUser);
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
      this.heeftDataToegangAddObject(currentUser);

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
      // TODO: PHP vereist hier isBeheerder() || isCIMT() || isTechnicus() (401 anders) - heeftToegang() is nog een no-op stub
      this.permissieService.heeftToegang(currentUser, 'Journaal.UpdateObject');
      this.heeftDataToegangUpdateObject(currentUser);

      const update = await this.normaliserenData(data) as Prisma.OperJournaalUncheckedUpdateInput;
      return await this.journaalService.UpdateObject(id, update, currentUser.ID);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`JournaalController.DeleteObject(${safeStringify({currentUser, id})})`);
      // TODO: PHP vereist hier isBeheerder() || isCIMT() (401 anders) - heeftToegang() is nog een no-op stub
      this.permissieService.heeftToegang(currentUser, 'Journaal.DeleteObject');
      this.heeftDataToegangDeleteObject(currentUser);

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
      this.heeftDataToegangRemoveObject(currentUser);
      await this.journaalService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`JournaalController.RestoreObject(${safeStringify({currentUser, id})})`);
      // TODO: PHP vereist hier isBeheerder() (401 anders, let op: beperkter dan Delete - geen isCIMT()) - heeftToegang() is nog een no-op stub
      this.permissieService.heeftToegang(currentUser, 'Journaal.RestoreObject');
      this.heeftDataToegangRestoreObject(currentUser);

      const data: Prisma.OperJournaalUncheckedUpdateInput = {
         VERWIJDERD: false
      }
      await this.journaalService.UpdateObject(id, data, currentUser.ID);
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

   //------------- Specifieke endpoints staan hieronder --------------------//

   // controleer of de gebruiker toegang heeft tot de data van Journaal/GetObject
   private heeftDataToegangGetObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Journaal/GetObjects
   private heeftDataToegangGetObjects(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Journaal/AddObject
   private heeftDataToegangAddObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Journaal/UpdateObject
   private heeftDataToegangUpdateObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Journaal/DeleteObject
   private heeftDataToegangDeleteObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Journaal/RemoveObject
   private heeftDataToegangRemoveObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Journaal/RestoreObject
   private heeftDataToegangRestoreObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }
}
