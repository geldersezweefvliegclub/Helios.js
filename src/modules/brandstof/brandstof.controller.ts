import {
   Body,
   Controller,
   HttpException,
   HttpStatus,
   Query
} from '@nestjs/common';
import {Prisma, RefLid} from '@prisma/client';
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {GetObjectRequest} from "../../core/DTO/IHeliosFilter";
import {
   HeliosController, HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject,
   HeliosRestoreObject, HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {ApiTags} from "@nestjs/swagger";
import {CurrentUser} from "../login/current-user.decorator";
import {PermissieService} from "../authorisatie/permissie.service";
import {BrandstofService} from "./brandstof.service";
import {OperBrandstofDto} from "../../generated/nestjs-dto/operBrandstof.dto";
import {GetObjectsOperBrandstofResponse} from "./GetObjectsOperBrandstofResponse";
import {CreateOperBrandstofDto} from "../../generated/nestjs-dto/create-operBrandstof.dto";
import {UpdateOperBrandstofDto} from "../../generated/nestjs-dto/update-operBrandstof.dto";
import {GetObjectsOperBrandstofRequest} from "./GetObjectsOperBrandstofRequest";
import {LedenService} from "../leden/leden.service";

@Controller('Brandstof')
@ApiTags('Brandstof')
export class BrandstofController  extends HeliosController
{
   constructor(private readonly brandstofService: BrandstofService,
               private readonly ledenService: LedenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperBrandstofDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectRequest): Promise<OperBrandstofDto>
   {
      this.permissieService.heeftToegang(user, 'Brandstof.GetObject');
      return await this.brandstofService.GetObject(queryParams.ID);
   }

   @HeliosGetObjects(GetObjectsOperBrandstofResponse)
   GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsOperBrandstofRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperBrandstofResponse>>
   {
      this.permissieService.heeftToegang(user, 'Brandstof.GetObjects');
      return this.brandstofService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperBrandstofDto, OperBrandstofDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateOperBrandstofDto): Promise<OperBrandstofDto>
   {
      this.permissieService.heeftToegang(user, 'Brandstof.AddObject');

      const lid = await this.ledenService.GetObject(data.LID_ID);
      if (!lid)
         throw new HttpException(`Lid with ID ${data.LID_ID} not found`, HttpStatus.NOT_FOUND);

      // remove BRANDSTOF_TYPE_ID and LID_ID from the data
      // and add it to the BrandstofType, RefLid property
      const { BRANDSTOF_TYPE_ID, LID_ID, ...insertData} = data;
      (insertData as Prisma.OperBrandstofCreateInput).BrandstofType = BRANDSTOF_TYPE_ID ? { connect: {ID: BRANDSTOF_TYPE_ID }} : undefined;
      (insertData as Prisma.OperBrandstofCreateInput).RefLid = LID_ID ? { connect: {ID: LID_ID }} : undefined;
      (insertData as Prisma.OperBrandstofCreateInput).NAAM = lid.NAAM

      return await this.brandstofService.AddObject(insertData as Prisma.OperBrandstofCreateInput);
   }

   @HeliosUpdateObject(UpdateOperBrandstofDto, OperBrandstofDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperBrandstofDto): Promise<OperBrandstofDto>
   {
      this.permissieService.heeftToegang(user, 'Brandstof.UpdateObject');
      const lid = await this.ledenService.GetObject(data.LID_ID);
      if (!lid)
         throw new HttpException(`Lid with ID ${data.LID_ID} not found`, HttpStatus.NOT_FOUND);

      // remove BRANDSTOF_TYPE_ID and LID_ID from the data
      // and add it to the BrandstofType, RefLid property
      const { BRANDSTOF_TYPE_ID, LID_ID, ...updateData} = data;
      (updateData as Prisma.OperBrandstofCreateInput).BrandstofType = (BRANDSTOF_TYPE_ID !== undefined) ? { connect: {ID: BRANDSTOF_TYPE_ID }} : undefined;
      (updateData as Prisma.OperBrandstofCreateInput).RefLid = LID_ID ? { connect: {ID: LID_ID }} : undefined;
      (updateData as Prisma.OperBrandstofCreateInput).NAAM = lid.NAAM

      return await this.brandstofService.UpdateObject(id, updateData as Prisma.OperBrandstofCreateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Brandstof.DeleteObject');

      const data: Prisma.OperBrandstofUpdateInput = {
         VERWIJDERD: true
      }
      await this.brandstofService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Brandstof.RemoveObject');
      await this.brandstofService.RemoveObject(id);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Brandstof.RestoreObject');

      const data: Prisma.OperBrandstofUpdateInput = {
         VERWIJDERD: false
      }
      await this.brandstofService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}
