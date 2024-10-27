import {
   Body,
   Controller,
   HttpException,
   HttpStatus,
   Query
} from '@nestjs/common';
import {TypesService} from "../types-services/types.service";
import {Prisma, RefTypes} from '@prisma/client';
import {GetObjectsRefTypesRequest} from "../DTO/TypesDTO";
import {IHeliosGetObjectsResponse} from "../../../core/DTO/IHeliosGetObjectsReponse";
import {GetObjectRequest} from "../../../core/DTO/IHeliosFilter";
import {
   HeliosController, HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject,
   HeliosRestoreObject, HeliosUpdateObject
} from "../../../core/controllers/helios/helios.controller";
import {CreateRefTypesDto} from "../../../generated/nestjs-dto/create-refTypes.dto";
import {UpdateRefTypesDto} from "../../../generated/nestjs-dto/update-refTypes.dto";
import {RefTypesDto} from "../../../generated/nestjs-dto/refTypes.dto";

@Controller('Types')
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

   @HeliosGetObjects(RefTypesDto)
   GetObjects(@Query() queryParams: GetObjectsRefTypesRequest): Promise<IHeliosGetObjectsResponse<RefTypesDto>>
   {
      return this.typesService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateRefTypesDto, RefTypesDto)
   async AddObject(@Body() data: CreateRefTypesDto): Promise<RefTypesDto>
   {
      try
      {
         const id = data.TYPEGROEP_ID;
         delete data.TYPEGROEP_ID;
         const insertData: Prisma.RefTypesCreateInput = {
            ...data,
            RefTypesGroepen: {
               connect: {
                  ID: id
               }
            }
         };
         return await this.typesService.AddObject(insertData);
         //return await this.typesService.AddObject(data);

         //return {} as RefTypesDto;
      }
      catch (e)
      {
         this.handlePrismaError(e)
      }
   }

   @HeliosUpdateObject(UpdateRefTypesDto, RefTypesDto)
   async UpdateObject(@Query('ID') id: number, @Body() data: UpdateRefTypesDto): Promise<RefTypes>
   {
      try
      {
         return await this.typesService.UpdateObject(id, data);
      }
      catch (e)
      {
         this.handlePrismaError(e)
      }
   }

   @HeliosDeleteObject()
   async DeleteObject(@Query('ID') id: number): Promise<void>
   {
      const data: Prisma.RefTypesUpdateInput = {
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
      const data: Prisma.RefTypesUpdateInput = {
         VERWIJDERD: false
      }
      await this.typesService.UpdateObject(id, data);
   }
}
