import {Body, Controller, Delete, Get, HttpException, HttpStatus, Patch, Post, Put, Query} from '@nestjs/common';
import {ApiOperation, ApiQuery, ApiResponse} from "@nestjs/swagger";
import {TypesGroepenService} from "../types-groepen-services/types-groepen.service";
import {Prisma, RefTypesGroepen} from '@prisma/client';
import {GetObjectsRefTypesGroepenRequest} from "../DTO/TypesGroepenDTO";
import {IHeliosGetObjectsResponse} from "../../../core/DTO/IHeliosGetObjectsReponse";
import {GetObjectRequest} from "../../../core/DTO/IHeliosFilter";
import {HeliosController} from "../../../core/controllers/helios/helios.controller";


@Controller('TypesGroepen')
export class TypesGroepenController extends HeliosController
{
   constructor(private readonly typesGroepenService: TypesGroepenService)
   {
      super()
   }

   @Get("GetObject")
   @ApiQuery({name: 'ID', required: true, type: Number})
   @ApiResponse({ status: 404, description: 'Record not found.' })
   async GetObject(@Query() queryParams: GetObjectRequest): Promise<RefTypesGroepen>
   {
      const obj =  await this.typesGroepenService.GetObject(queryParams.ID);
      if (!obj)
         throw new HttpException(`Record with ID ${queryParams.ID} not found`, 404);

      return obj;
   }

   @Get("GetObjects")
   @ApiQuery({name: 'VERWIJDERD', required: false, type: Boolean})
   @ApiQuery({name: 'VELDEN', required: false, type: String})
   @ApiQuery({name: 'SORT', required: false, type: String})
   @ApiQuery({name: 'MAX', required: false, type: Number})
   @ApiQuery({name: 'START', required: false, type: Number})
   @ApiQuery({name: 'HASH', required: false, type: String})
   @ApiQuery({name: 'IDs', required: false, type: String})
   @ApiQuery({name: 'ID', required: false, type: Number})
   GetObjects(@Query() queryParams: GetObjectsRefTypesGroepenRequest): Promise<IHeliosGetObjectsResponse<RefTypesGroepen>>
   {
      // sort is optional, so if it is not provided, it should default to "SORTEER_VOLGORDE"
      queryParams.SORT = queryParams.SORT ?? "SORTEER_VOLGORDE";
      return this.typesGroepenService.GetObjects(queryParams);
   }

   @Post("SaveObject")
   @ApiOperation({ summary: 'Create a new record' })
   async SaveObject(@Body() data: Prisma.RefTypesGroepenCreateInput): Promise<RefTypesGroepen>
   {
      return this.typesGroepenService.AddObject(data);
   }

   @Put("SaveObject")
   @ApiOperation({ summary: 'Update an existing record' })
   // @ApiResponse({ status: 201, description: 'The record has been successfully created.', type: RefTypesGroepen })
   async UpdateObject(@Query('ID') id: number, @Body() data: Prisma.RefTypesGroepenUpdateInput): Promise<RefTypesGroepen>
   {
      return this.typesGroepenService.UpdateObject(id, data);
   }

   @Delete("DeleteObject")
   @ApiOperation({ summary: 'Delete a record by setting VERWIJDERD=true' })
   @ApiQuery({name: 'ID', required: true, type: Number})
   @ApiResponse({ status: 404, description: 'Record not found.' })
   @ApiResponse({ status: 409, description: 'Record is already deleted.' })
   @ApiResponse({ status: 204, description: 'The record has been successfully deleted.' })
   async DeleteObject(@Query('ID') id: number): Promise<void>
   {
      this.DeletePreconditions(this.typesGroepenService,id);

      const data: Prisma.RefTypesGroepenUpdateInput = {
         VERWIJDERD: true
      }
      this.typesGroepenService.UpdateObject(id, data);
   }

   @Patch("RestoreObject")
   @ApiOperation({ summary: 'Restore a deleted record by setting VERWIJDERD=false' })
   @ApiQuery({name: 'ID', required: true, type: Number})
   @ApiResponse({ status: 202, description: 'The record has been successfully restored.' })
   async RestoreObject(@Query('ID') id: number): Promise<void>
   {
      const data: Prisma.RefTypesGroepenUpdateInput = {
         VERWIJDERD: false
      }
      this.typesGroepenService.UpdateObject(id, data);
   }
}
