import {Body, Controller, Delete, Get, Patch, Post, Put, Query} from '@nestjs/common';
import {ApiQuery, ApiResponse} from "@nestjs/swagger";
import {TypesGroepenService} from "../types-groepen-services/types-groepen.service";
import {Prisma, RefTypesGroepen} from '@prisma/client';
import {GetObjectsRefTypesGroepenRequest} from "../DTO/TypesGroepenDTO";
import {IHeliosGetObjectsResponse} from "../../../core/DTO/IHeliosGetObjectsReponse";
import {GetObjectRequest} from "../../../core/DTO/IHeliosFilter";


@Controller('TypesGroepen')
export class TypesGroepenController
{
   constructor(private readonly typesGroepenService: TypesGroepenService)
   {
   }

   @Get("GetObject")
   @ApiQuery({name: 'ID', required: true, type: Number})
   GetObject(@Query() queryParams: GetObjectRequest): Promise<RefTypesGroepen>
   {
      return this.typesGroepenService.GetObject(queryParams.ID);
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
   async SaveObject(@Body() data: Prisma.RefTypesGroepenCreateInput): Promise<RefTypesGroepen>
   {
      return this.typesGroepenService.AddObject(data);
   }

   @Put("SaveObject")
   // @ApiResponse({ status: 201, description: 'The record has been successfully created.', type: RefTypesGroepen })
   async UpdateObject(@Query('ID') id: number, @Body() data: Prisma.RefTypesGroepenUpdateInput): Promise<RefTypesGroepen>
   {
      return this.typesGroepenService.UpdateObject(id, data);
   }

   @Delete("DeleteObject")
   @ApiQuery({name: 'ID', required: true, type: Number})
   @ApiResponse({ status: 204, description: 'The record has been successfully deleted.' })
   async DeleteObject(@Query('ID') id: number): Promise<void>
   {
      const data: Prisma.RefTypesGroepenUpdateInput = {
         VERWIJDERD: true
      }
      this.typesGroepenService.UpdateObject(id, data);
   }

   @Patch("RestoreObject")
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
