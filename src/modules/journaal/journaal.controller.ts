import {Body, Controller, Query} from '@nestjs/common';
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

@Controller('Journaal')
@ApiTags('Journaal')
export class JournaalController extends HeliosController
{
   constructor(private readonly journaalService: JournaalService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperJournaalDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<OperJournaalDto>
   {
      this.permissieService.heeftToegang(user, 'Journaal.GetObject');
      return await this.journaalService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperJournaalResponse)
   async GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsOperJournaalRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperJournaalResponse>>
   {
      this.permissieService.heeftToegang(user, 'Journaal.GetObjects');
      return await this.journaalService.GetObjects (queryParams);
   }

   @HeliosCreateObject(CreateOperJournaalDto, OperJournaalDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateOperJournaalDto): Promise<OperJournaalDto>
   {
      this.permissieService.heeftToegang(user, 'Journaal.AddObject');

      // remove MELDER_ID, TECHNICUS_ID, AFGETEKEND_ID, CATEGORIE_ID, STATUS_ID, ROLLEND_ID, VLIEGTUIG_ID from the data
      // and add them as connect to the insertData object
      const { MELDER_ID, TECHNICUS_ID, AFGETEKEND_ID, CATEGORIE_ID, STATUS_ID, ROLLEND_ID, VLIEGTUIG_ID,  ...insertData} = data;
      (insertData as Prisma.OperJournaalCreateInput).Vliegtuig = (VLIEGTUIG_ID !== undefined) ? { connect: {ID: VLIEGTUIG_ID }} : undefined;
      (insertData as Prisma.OperJournaalCreateInput).Rollend = (ROLLEND_ID !== undefined) ? { connect: {ID: ROLLEND_ID }} : undefined;
      (insertData as Prisma.OperJournaalCreateInput).Status = (STATUS_ID !== undefined) ? { connect: {ID: STATUS_ID }} : undefined;
      (insertData as Prisma.OperJournaalCreateInput).Categorie = (CATEGORIE_ID !== undefined) ? { connect: {ID: CATEGORIE_ID }} : undefined;
      (insertData as Prisma.OperJournaalCreateInput).Melder = (MELDER_ID !== undefined) ? { connect: {ID: MELDER_ID }} : undefined;
      (insertData as Prisma.OperJournaalCreateInput).Technicus = (TECHNICUS_ID !== undefined) ? { connect: {ID: TECHNICUS_ID }} : undefined;
      (insertData as Prisma.OperJournaalCreateInput).Afgetekend = (AFGETEKEND_ID !== undefined) ? { connect: {ID: AFGETEKEND_ID }} : undefined;

      return await this.journaalService.AddObject(insertData as Prisma.OperJournaalCreateInput);
   }

   @HeliosUpdateObject(UpdateOperJournaalDto, OperJournaalDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperJournaalDto): Promise<OperJournaal>
   {
      this.permissieService.heeftToegang(user, 'Journaal.UpdateObject');

      // remove MELDER_ID, TECHNICUS_ID, AFGETEKEND_ID, CATEGORIE_ID, STATUS_ID, ROLLEND_ID, VLIEGTUIG_ID from the data
      // and add them as connect to the updateData object
      const { MELDER_ID, TECHNICUS_ID, AFGETEKEND_ID, CATEGORIE_ID, STATUS_ID, ROLLEND_ID, VLIEGTUIG_ID,  ...updateData} = data;
      (updateData as Prisma.OperJournaalCreateInput).Vliegtuig = (VLIEGTUIG_ID !== undefined) ? { connect: {ID: VLIEGTUIG_ID }} : undefined;
      (updateData as Prisma.OperJournaalCreateInput).Rollend = (ROLLEND_ID !== undefined) ? { connect: {ID: ROLLEND_ID }} : undefined;
      (updateData as Prisma.OperJournaalCreateInput).Status = (STATUS_ID !== undefined) ? { connect: {ID: STATUS_ID }} : undefined;
      (updateData as Prisma.OperJournaalCreateInput).Categorie = (CATEGORIE_ID !== undefined) ? { connect: {ID: CATEGORIE_ID }} : undefined;
      (updateData as Prisma.OperJournaalCreateInput).Melder = (MELDER_ID !== undefined) ? { connect: {ID: MELDER_ID }} : undefined;
      (updateData as Prisma.OperJournaalCreateInput).Technicus = (TECHNICUS_ID !== undefined) ? { connect: {ID: TECHNICUS_ID }} : undefined;
      (updateData as Prisma.OperJournaalCreateInput).Afgetekend = (AFGETEKEND_ID !== undefined) ? { connect: {ID: AFGETEKEND_ID }} : undefined;

      return await this.journaalService.UpdateObject(id, updateData as Prisma.OperJournaalUpdateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Journaal.DeleteObject');

      const data: Prisma.OperJournaalUpdateInput = {
         VERWIJDERD: true
      }
      await this.journaalService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Journaal.RemoveObject');
      await this.journaalService.RemoveObject(id);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Journaal.RestoreObject');

      const data: Prisma.OperJournaalUpdateInput = {
         VERWIJDERD: false
      }
      await this.journaalService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//
   
}
