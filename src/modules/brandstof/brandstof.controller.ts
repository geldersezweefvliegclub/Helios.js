import {
   Body,
   Controller,
   HttpException,
   HttpStatus,
   Query
} from '@nestjs/common';
import {Prisma, RefLid} from '@prisma/client';
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
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

@Controller('Brandstof')
@ApiTags('Brandstof')
export class BrandstofController  extends HeliosController
{
   constructor(private readonly brandstofService: BrandstofService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperBrandstofDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<OperBrandstofDto>
   {
      this.permissieService.heeftToegang(user, 'Brandstof.GetObject');
      return await this.brandstofService.GetObject(id);
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

      if (data.LID_ID === undefined)
         throw new HttpException("LidID is verplicht", HttpStatus.BAD_REQUEST);

      return await this.brandstofService.AddObject(data);
   }

   @HeliosUpdateObject(UpdateOperBrandstofDto, OperBrandstofDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperBrandstofDto): Promise<OperBrandstofDto>
   {
      this.permissieService.heeftToegang(user, 'Brandstof.UpdateObject');
      return await this.brandstofService.UpdateObject(id, data);
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