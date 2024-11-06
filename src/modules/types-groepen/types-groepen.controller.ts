import {
   Body,
   Controller,
   HttpException,
   HttpStatus,
   Query, UseGuards
} from '@nestjs/common';
import {TypesGroepenService} from "./types-groepen.service";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsReponse";
import {GetObjectRequest} from "../../core/DTO/IHeliosFilter";
import {
   HeliosController, HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject,
   HeliosRestoreObject, HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {CreateRefTypesGroepenDto} from "../../generated/nestjs-dto/create-refTypesGroepen.dto";
import {UpdateRefTypesGroepenDto} from "../../generated/nestjs-dto/update-refTypesGroepen.dto";
import {RefTypesGroepenDto} from "../../generated/nestjs-dto/refTypesGroepen.dto";
import {GetObjectsRefTypesGroepenRequest} from "./TypesGroepDTO";
import {Prisma, RefLid, RefTypesGroep} from "@prisma/client";
import {CurrentUser} from "../login/current-user.decorator";
import {JwtAuthGuard} from "../login/guards/jwt-auth.guard";


@Controller('TypesGroepen')
export class TypesGroepenController extends HeliosController
{
   constructor(private readonly typesGroepenService: TypesGroepenService)
   {
      super()
   }

   @HeliosGetObject(RefTypesGroepenDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectRequest): Promise<RefTypesGroepenDto>
   {
      const obj =  await this.typesGroepenService.GetObject(queryParams.ID);
      if (!obj)
         throw new HttpException(`Record with ID ${queryParams.ID} not found`, HttpStatus.NOT_FOUND);

      return obj;
   }

   @HeliosGetObjects(RefTypesGroepenDto)
   GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsRefTypesGroepenRequest): Promise<IHeliosGetObjectsResponse<RefTypesGroepenDto>>
   {
      return this.typesGroepenService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateRefTypesGroepenDto, RefTypesGroepenDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateRefTypesGroepenDto): Promise<RefTypesGroepenDto>
   {
      try
      {
         return await this.typesGroepenService.AddObject(data);
      }
      catch (e)
      {
         this.handlePrismaError(e)
      }
   }

   @HeliosUpdateObject(UpdateRefTypesGroepenDto, RefTypesGroepenDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateRefTypesGroepenDto): Promise<RefTypesGroep>
   {
      try
      {
         return await this.typesGroepenService.UpdateObject(id, data);
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
      const data: Prisma.RefTypesGroepUpdateInput = {
         VERWIJDERD: true
      }
      try
      {
         await this.typesGroepenService.UpdateObject(id, data);
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
      try
      {
         await this.typesGroepenService.RemoveObject(id);
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
      const data: Prisma.RefTypesGroepUpdateInput = {
         VERWIJDERD: false
      }
      await this.typesGroepenService.UpdateObject(id, data);
   }
}
