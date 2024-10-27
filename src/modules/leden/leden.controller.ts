import {
   Body,
   Controller,
   HttpException,
   HttpStatus,
   Query
} from '@nestjs/common';
import {Prisma, RefLid} from '@prisma/client';
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsReponse";
import {GetObjectRequest} from "../../core/DTO/IHeliosFilter";
import {
   HeliosController, HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject,
   HeliosRestoreObject, HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {LedenService} from "./leden.service";
import {RefLidDto} from "../../generated/nestjs-dto/refLid.dto";
import {GetObjectsRefLedenRequest} from "./LedenDTO";
import {CreateRefLidDto} from "../../generated/nestjs-dto/create-refLid.dto";
import {UpdateRefLidDto} from "../../generated/nestjs-dto/update-refLid.dto";


@Controller('Leden')
export class LedenController extends HeliosController
{
   constructor(private readonly ledenService: LedenService)
   {
      super()
   }

   @HeliosGetObject(RefLidDto)
   async GetObject(@Query() queryParams: GetObjectRequest): Promise<RefLidDto>
   {
      const obj =  await this.ledenService.GetObject(queryParams.ID);
      if (!obj)
         throw new HttpException(`Record with ID ${queryParams.ID} not found`, HttpStatus.NOT_FOUND);

      return obj;
   }

   @HeliosGetObjects(RefLidDto)
   GetObjects(@Query() queryParams: GetObjectsRefLedenRequest): Promise<IHeliosGetObjectsResponse<RefLidDto>>
   {
      return this.ledenService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateRefLidDto, RefLidDto)
   async AddObject(@Body() data: CreateRefLidDto): Promise<RefLidDto>
   {
      try
      {
         //return await this.ledenService.AddObject(insertData);
         //return await this.ledenService.AddObject(data);

         return {} as RefLidDto;
      }
      catch (e)
      {
         this.handlePrismaError(e)
      }
   }

   @HeliosUpdateObject(UpdateRefLidDto, RefLidDto)
   async UpdateObject(@Query('ID') id: number, @Body() data: UpdateRefLidDto): Promise<RefLid>
   {
      try
      {
         return await this.ledenService.UpdateObject(id, data);
      }
      catch (e)
      {
         this.handlePrismaError(e)
      }
   }

   @HeliosDeleteObject()
   async DeleteObject(@Query('ID') id: number): Promise<void>
   {
      const data: Prisma.RefLidUpdateInput = {
         VERWIJDERD: true
      }
      try
      {
         await this.ledenService.UpdateObject(id, data);
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
         await this.ledenService.RemoveObject(id);
      }
      catch (e)
      {
         this.handlePrismaError(e)
      }
   }

   @HeliosRestoreObject()
   async RestoreObject(@Query('ID') id: number): Promise<void>
   {
      const data: Prisma.RefLidUpdateInput = {
         VERWIJDERD: false
      }
      await this.ledenService.UpdateObject(id, data);
   }
}
