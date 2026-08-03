import {
   Body,
   Controller,
   HttpException,
   HttpStatus,
   Logger,
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
import {safeStringify} from "../../core/helpers/LogHelper";

@Controller('Brandstof')
@ApiTags('Brandstof')
export class BrandstofController  extends HeliosController
{
   private readonly logger = new Logger(BrandstofController.name);

   constructor(private readonly brandstofService: BrandstofService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperBrandstofDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperBrandstofDto>
   {
      this.logger.verbose(`BrandstofController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Brandstof.GetObject');
      return await this.brandstofService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperBrandstofResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperBrandstofRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperBrandstofResponse>>
   {
      this.logger.verbose(`BrandstofController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Brandstof.GetObjects');
      return await this.brandstofService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperBrandstofDto, OperBrandstofDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperBrandstofDto): Promise<OperBrandstofDto>
   {
      this.logger.verbose(`BrandstofController.AddObject(${safeStringify({currentUser, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Brandstof.AddObject');

      if (data.LID_ID === undefined)
         throw new HttpException("LidID is verplicht", HttpStatus.BAD_REQUEST);

      return await this.brandstofService.AddObject(data);
   }

   @HeliosUpdateObject(UpdateOperBrandstofDto, OperBrandstofDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperBrandstofDto): Promise<OperBrandstofDto>
   {
      this.logger.verbose(`BrandstofController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Brandstof.UpdateObject');
      return await this.brandstofService.UpdateObject(id, data);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`BrandstofController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Brandstof.DeleteObject');

      const data: Prisma.OperBrandstofUpdateInput = {
         VERWIJDERD: true
      }
      await this.brandstofService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`BrandstofController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Brandstof.RemoveObject');
      await this.brandstofService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`BrandstofController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Brandstof.RestoreObject');

      const data: Prisma.OperBrandstofUpdateInput = {
         VERWIJDERD: false
      }
      await this.brandstofService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}