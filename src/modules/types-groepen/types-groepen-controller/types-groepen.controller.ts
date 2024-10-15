import {
   Body,
   Controller,
   HttpException,
   HttpStatus,
   Query
} from '@nestjs/common';
import {TypesGroepenService} from "../types-groepen-services/types-groepen.service";
import {Prisma, RefTypesGroepen} from '@prisma/client';
import {GetObjectsRefTypesGroepenRequest} from "../DTO/TypesGroepenDTO";
import {IHeliosGetObjectsResponse} from "../../../core/DTO/IHeliosGetObjectsReponse";
import {GetObjectRequest} from "../../../core/DTO/IHeliosFilter";
import {
   HeliosController, HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject,
   HeliosRestoreObject, HeliosUpdateObject
} from "../../../core/controllers/helios/helios.controller";
import {CreateRefTypesGroepenDto} from "../../../generated/nestjs-dto/create-refTypesGroepen.dto";
import {UpdateRefTypesGroepenDto} from "../../../generated/nestjs-dto/update-refTypesGroepen.dto";
import {RefTypesGroepenDto} from "../../../generated/nestjs-dto/refTypesGroepen.dto";


@Controller('TypesGroepen')
export class TypesGroepenController extends HeliosController
{
   constructor(private readonly typesGroepenService: TypesGroepenService)
   {
      super()
   }

   @HeliosGetObject(RefTypesGroepenDto)
   async GetObject(@Query() queryParams: GetObjectRequest): Promise<RefTypesGroepenDto>
   {
      const obj =  await this.typesGroepenService.GetObject(queryParams.ID);
      if (!obj)
         throw new HttpException(`Record with ID ${queryParams.ID} not found`, HttpStatus.NOT_FOUND);

      return obj;
   }

   @HeliosGetObjects(RefTypesGroepenDto)
   GetObjects(@Query() queryParams: GetObjectsRefTypesGroepenRequest): Promise<IHeliosGetObjectsResponse<RefTypesGroepenDto>>
   {
      // sort is optional, so if it is not provided, it should default to "SORTEER_VOLGORDE"
      queryParams.SORT = queryParams.SORT ?? "SORTEER_VOLGORDE";
      return this.typesGroepenService.GetObjects(queryParams);
   }

   @HeliosCreateObject(RefTypesGroepenDto)
   async AddObject(@Body() data: CreateRefTypesGroepenDto): Promise<RefTypesGroepenDto>
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

   @HeliosUpdateObject(RefTypesGroepenDto)
   async UpdateObject(@Query('ID') id: number, @Body() data: UpdateRefTypesGroepenDto): Promise<RefTypesGroepen>
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
   async DeleteObject(@Query('ID') id: number): Promise<void>
   {
      const data: Prisma.RefTypesGroepenUpdateInput = {
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
   async RemoveObject(@Query('ID') id: number): Promise<void>
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
   async RestoreObject(@Query('ID') id: number): Promise<void>
   {
      const data: Prisma.RefTypesGroepenUpdateInput = {
         VERWIJDERD: false
      }
      await this.typesGroepenService.UpdateObject(id, data);
   }
}
