import {
   Body,
   Controller,
   HttpException,
   HttpStatus,
   Query
} from '@nestjs/common';
import {TypesService} from "./types.service";
import {Prisma, RefType} from '@prisma/client';
import {GetObjectsRefTypesRequest} from "./GetObjectsRefTypesRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsReponse";
import {GetObjectRequest} from "../../core/DTO/IHeliosFilter";
import {
   HeliosController, HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject,
   HeliosRestoreObject, HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {CreateRefTypesDto} from "../../generated/nestjs-dto/create-refTypes.dto";
import {UpdateRefTypesDto} from "../../generated/nestjs-dto/update-refTypes.dto";
import {RefTypesDto} from "../../generated/nestjs-dto/refTypes.dto";
import {ApiTags} from "@nestjs/swagger";
import {GetObjectsRefTypesReponse} from "./GetObjectsRefTypesResponse";

@Controller('Types')
@ApiTags('Types')
export class TypesController extends HeliosController
{
   constructor(private readonly typesService: TypesService)
   {
      super()
   }

   @HeliosGetObject(RefTypesDto)
   async GetObject(@Query() queryParams: GetObjectRequest): Promise<RefTypesDto>
   {
      const obj =  await this.typesService.GetObject(queryParams.ID);
      if (!obj)
         throw new HttpException(`Record with ID ${queryParams.ID} not found`, HttpStatus.NOT_FOUND);

      return obj;
   }

   @HeliosGetObjects(GetObjectsRefTypesReponse)
   GetObjects(@Query() queryParams: GetObjectsRefTypesRequest): Promise<IHeliosGetObjectsResponse<GetObjectsRefTypesReponse>>
   {
      return this.typesService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateRefTypesDto, RefTypesDto)
   async AddObject(@Body() data: CreateRefTypesDto): Promise<RefTypesDto>
   {
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

   @HeliosUpdateObject(UpdateRefTypesDto, RefTypesDto)
   async UpdateObject(@Query('ID') id: number, @Body() data: UpdateRefTypesDto): Promise<RefType>
   {
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
   async DeleteObject(@Query('ID') id: number): Promise<void>
   {
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
   async RemoveObject(@Query('ID') id: number): Promise<void>
   {
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
   async RestoreObject(@Query('ID') id: number): Promise<void>
   {
      const data: Prisma.RefTypeUpdateInput = {
         VERWIJDERD: false
      }
      await this.typesService.UpdateObject(id, data);
   }
}
