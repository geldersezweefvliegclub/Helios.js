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

      // verwijder MELDER_ID, TECHNICUS_ID, AFGETEKEND_ID, CATEGORIE_ID, STATUS_ID, ROLLEND_ID, VLIEGTUIG_ID uit de data
      // en voeg ze toe als connect aan het insertData object
      const { MELDER_ID, TECHNICUS_ID, AFGETEKEND_ID, CATEGORIE_ID, STATUS_ID, ROLLEND_ID, VLIEGTUIG_ID,  ...insertData} = data;
      const connect = (id?: number) => id !== undefined ? { connect: { ID: id } } : undefined;
      const insert = insertData as Prisma.OperJournaalCreateInput;
      insert.Vliegtuig = connect(VLIEGTUIG_ID);
      insert.Rollend = connect(ROLLEND_ID);
      insert.Status = connect(STATUS_ID);
      insert.Categorie = connect(CATEGORIE_ID);
      insert.Melder = connect(MELDER_ID);
      insert.Technicus = connect(TECHNICUS_ID);
      insert.Afgetekend = connect(AFGETEKEND_ID);

      return await this.journaalService.AddObject(insert);
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

      // verwijder MELDER_ID, TECHNICUS_ID, AFGETEKEND_ID, CATEGORIE_ID, STATUS_ID, ROLLEND_ID, VLIEGTUIG_ID uit de data
      // en voeg ze toe als connect aan het updateData object
      const { MELDER_ID, TECHNICUS_ID, AFGETEKEND_ID, CATEGORIE_ID, STATUS_ID, ROLLEND_ID, VLIEGTUIG_ID,  ...updateData} = data;
      const connect = (id?: number) => id !== undefined ? { connect: { ID: id } } : undefined;
      const update = updateData as Prisma.OperJournaalUpdateInput;
      update.Vliegtuig = connect(VLIEGTUIG_ID);
      update.Rollend = connect(ROLLEND_ID);
      update.Status = connect(STATUS_ID);
      update.Categorie = connect(CATEGORIE_ID);
      update.Melder = connect(MELDER_ID);
      update.Technicus = connect(TECHNICUS_ID);
      update.Afgetekend = connect(AFGETEKEND_ID);

      return await this.journaalService.UpdateObject(id, update);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`JournaalController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Journaal.DeleteObject');

      const data: Prisma.OperJournaalUpdateInput = {
         VERWIJDERD: true
      }
      await this.journaalService.UpdateObject(id, data);
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

      const data: Prisma.OperJournaalUpdateInput = {
         VERWIJDERD: false
      }
      await this.journaalService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//
   
}
