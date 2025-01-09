import {
   Body,
   Controller,
   HttpException,
   HttpStatus,
   Query
} from '@nestjs/common';
import {TypesService} from "./types.service";
import {Prisma, RefLid, RefType} from '@prisma/client';
import {GetObjectsRefTypesRequest} from "./GetObjectsRefTypesRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsReponse";
import {GetObjectRequest} from "../../core/DTO/IHeliosFilter";
import {
   HeliosController, HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject,
   HeliosRestoreObject, HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {CreateRefTypeDto} from "../../generated/nestjs-dto/create-refType.dto";
import {UpdateRefTypeDto} from "../../generated/nestjs-dto/update-refType.dto";
import {RefTypeDto} from "../../generated/nestjs-dto/refType.dto";
import {ApiTags} from "@nestjs/swagger";
import {GetObjectsRefTypesReponse} from "./GetObjectsRefTypesResponse";
import {CurrentUser} from "../login/current-user.decorator";
import {PermissieService} from "../authorisatie/permissie.service";

@Controller('Types')
@ApiTags('Types')
export class TypesController extends HeliosController
{
   constructor(private readonly typesService: TypesService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(RefTypeDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectRequest): Promise<RefTypeDto>
   {
      this.permissieService.heeftToegang(user, 'Types.GetObject');
      const obj =  await this.typesService.GetObject(queryParams.ID);
      if (!obj)
         throw new HttpException(`Record with ID ${queryParams.ID} not found`, HttpStatus.NOT_FOUND);

      return obj;
   }

   @HeliosGetObjects(GetObjectsRefTypesReponse)
   GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsRefTypesRequest): Promise<IHeliosGetObjectsResponse<GetObjectsRefTypesReponse>>
   {
      this.permissieService.heeftToegang(user, 'Types.GetObjects');
      return this.typesService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateRefTypeDto, RefTypeDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateRefTypeDto): Promise<RefTypeDto>
   {
      this.permissieService.heeftToegang(user, 'Types.AddObject');
      try
      {
         // remove TYPEGROEP_ID from the data
         // and add it to the TypesGroep property
         const { TYPEGROEP_ID, ...insertData} = data;
         (insertData as Prisma.RefTypeCreateInput).TypesGroep = TYPEGROEP_ID ? { connect: {ID: TYPEGROEP_ID }} : undefined

         return await this.typesService.AddObject(insertData as Prisma.RefTypeCreateInput);
      }
      catch (e)
      {
         this.handlePrismaError(e)
      }
   }

   @HeliosUpdateObject(UpdateRefTypeDto, RefTypeDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateRefTypeDto): Promise<RefType>
   {
      this.permissieService.heeftToegang(user, 'Types.UpdateObject');
      try
      {
         // remove TYPEGROEP_ID from the data
         // and add it to the TypesGroep property
         const { TYPEGROEP_ID, ...updateData} = data;
         (updateData as Prisma.RefTypeCreateInput).TypesGroep = (TYPEGROEP_ID !== undefined) ? { connect: {ID: TYPEGROEP_ID }} : undefined

         return await this.typesService.UpdateObject(id, updateData as Prisma.RefTypeCreateInput);
      }
      catch (e)
      {
         this.handlePrismaError(e)
      }
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Types.DeleteObject');

      const data: Prisma.RefTypeUpdateInput = {
         VERWIJDERD: true
      }
      try
      {
         await this.typesService.UpdateObject(id, data);
      }
      catch (e)
      {
         this.handlePrismaError(e)
      }
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Types.RemoveObject');
      try
      {
         await this.typesService.RemoveObject(id);
      }
      catch (e)
      {
         this.handlePrismaError(e)
      }
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Types.RestoreObject');

      const data: Prisma.RefTypeUpdateInput = {
         VERWIJDERD: false
      }
      await this.typesService.UpdateObject(id, data);
   }
}
