import {Body, Controller, Delete, Get, HttpException, Patch, Post, Put, Query} from '@nestjs/common';
import {ApiOperation, ApiQuery, ApiResponse, ApiExtraModels, getSchemaPath} from "@nestjs/swagger";
import {TypesGroepenService} from "../types-groepen-services/types-groepen.service";
import {Prisma, RefTypesGroepen} from '@prisma/client';
import {GetObjectsRefTypesGroepenRequest} from "../DTO/TypesGroepenDTO";
import {IHeliosGetObjectsResponse} from "../../../core/DTO/IHeliosGetObjectsReponse";
import {GetObjectRequest} from "../../../core/DTO/IHeliosFilter";
import {HeliosController} from "../../../core/controllers/helios/helios.controller";
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

   @Get("GetObject")
   @ApiExtraModels(RefTypesGroepenDto)
   @ApiQuery({name: 'ID', required: true, type: Number})
   @ApiOperation({ summary: 'Ophalen enkel record op basis van ID' })
   @ApiResponse({ status: 200, description: 'Record opgehaald.',   schema: {
         '$ref': getSchemaPath(RefTypesGroepenDto)
      }})
   @ApiResponse({ status: 404, description: 'Record niet gevonden.' })
   async GetObject(@Query() queryParams: GetObjectRequest): Promise<RefTypesGroepenDto>
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
   @ApiOperation({ summary: 'Ophalen records' })
   @ApiResponse({ status: 200, description: 'Data opgehaald.' })
   GetObjects(@Query() queryParams: GetObjectsRefTypesGroepenRequest): Promise<IHeliosGetObjectsResponse<RefTypesGroepenDto>>
   {
      // sort is optional, so if it is not provided, it should default to "SORTEER_VOLGORDE"
      queryParams.SORT = queryParams.SORT ?? "SORTEER_VOLGORDE";
      return this.typesGroepenService.GetObjects(queryParams);
   }

   @Post("SaveObject")
   @ApiExtraModels(RefTypesGroepenDto)
   @ApiOperation({ summary: 'Aanmaken a nieuw record' })
   @ApiResponse({ status: 201, description: 'Record aangemaakt.',   schema: {
         '$ref': getSchemaPath(RefTypesGroepenDto)
      }})
   async SaveObject(@Body() data: CreateRefTypesGroepenDto): Promise<RefTypesGroepenDto>
   {
      return this.typesGroepenService.AddObject(data);
   }

   @Put("SaveObject")
   @ApiExtraModels(RefTypesGroepenDto)
   @ApiOperation({ summary: 'Update an existing record' })
   @ApiResponse({ status: 201, description: 'Record aangepast.',   schema: {
         '$ref': getSchemaPath(RefTypesGroepenDto)
      }})
   async UpdateObject(@Query('ID') id: number, @Body() data: UpdateRefTypesGroepenDto): Promise<RefTypesGroepen>
   {
      return this.typesGroepenService.UpdateObject(id, data);
   }

   @Delete("DeleteObject")
   @ApiOperation({ summary: 'Verwijder record door VERWIJDERD op true te zetten' })
   @ApiQuery({name: 'ID', required: true, type: Number})
   @ApiResponse({ status: 204, description: 'Het record is succesvol verwijderd.' })
   @ApiResponse({ status: 404, description: 'Record niet gevonden.' })
   @ApiResponse({ status: 409, description: 'Record is reeds verwijderd.' })
   async DeleteObject(@Query('ID') id: number): Promise<void>
   {
      this.DeletePreconditions(this.typesGroepenService,id);

      const data: Prisma.RefTypesGroepenUpdateInput = {
         VERWIJDERD: true
      }
      this.typesGroepenService.UpdateObject(id, data);
   }

   @Delete("RemoveObject")
   @ApiOperation({ summary: 'Verwijder record uit de database, herstel niet mogelijk' })
   @ApiQuery({name: 'ID', required: true, type: Number})
   @ApiResponse({ status: 204, description: 'Het record is succesvol verwijderd.' })
   @ApiResponse({ status: 404, description: 'Record niet gevonden.' })
   async RemoveObject(@Query('ID') id: number): Promise<void>
   {
      const data: Prisma.RefTypesGroepenUpdateInput = {
         VERWIJDERD: true
      }
      this.typesGroepenService.UpdateObject(id, data);
   }

   @Patch("RestoreObject")
   @ApiOperation({ summary: 'Herstel een verwijderd record door VERWIJDERD op false te zetten' })
   @ApiQuery({name: 'ID', required: true, type: Number})
   @ApiResponse({ status: 202, description: 'Het record is succesvol hersteld.' })
   @ApiResponse({ status: 404, description: 'Record niet gevonden.' })
   @ApiResponse({ status: 409, description: 'Record is niet verwijderd.' })
   async RestoreObject(@Query('ID') id: number): Promise<void>
   {
      const data: Prisma.RefTypesGroepenUpdateInput = {
         VERWIJDERD: false
      }
      this.typesGroepenService.UpdateObject(id, data);
   }
}
