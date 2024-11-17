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
   HeliosGetObject, HeliosGetObjects, HeliosRemoveObject,
   HeliosRestoreObject, HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {LedenService} from "./leden.service";
import {RefLidDto} from "../../generated/nestjs-dto/refLid.dto";
import { GetObjectsRefLedenRequest} from "./GetObjectsRefLedenRequest";
import {CreateRefLidDto} from "../../generated/nestjs-dto/create-refLid.dto";
import {UpdateRefLidDto} from "../../generated/nestjs-dto/update-refLid.dto";
import {GetObjectsRefLedenResponse} from "./GetObjectsRefLedenResponse";
import {ApiTags} from "@nestjs/swagger";

@Controller('Leden')
@ApiTags('Leden')
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

   @HeliosGetObjects(GetObjectsRefLedenResponse)
   GetObjects(@Query() queryParams: GetObjectsRefLedenRequest): Promise<IHeliosGetObjectsResponse<RefLidDto>>
   {
      return this.ledenService.GetObjectsByQuery (queryParams);
   }

   @HeliosCreateObject(CreateRefLidDto, RefLidDto)
   async AddObject(@Body() data: CreateRefLidDto): Promise<RefLidDto>
   {
      try
      {
         // remove LIDTYPE_ID, STATUSTYPE_ID, ZUSTERCLUB_ID, BUDDY_ID, BUDDY_ID2 from the data
         // and add them as connect to the insertData object
         const { LIDTYPE_ID, STATUSTYPE_ID, ZUSTERCLUB_ID, BUDDY_ID, BUDDY_ID2, ...insertData} = data;
         (insertData as Prisma.RefLidCreateInput).LidType = (LIDTYPE_ID !== undefined) ? { connect: {ID: LIDTYPE_ID }} : undefined;
         (insertData as Prisma.RefLidCreateInput).VliegStatus = (STATUSTYPE_ID !== undefined) ? { connect: {ID: STATUSTYPE_ID }} : undefined;
         (insertData as Prisma.RefLidCreateInput).Zusterclub = (ZUSTERCLUB_ID !== undefined) ? { connect: {ID: ZUSTERCLUB_ID }} : undefined;
         (insertData as Prisma.RefLidCreateInput).Buddy = (BUDDY_ID !== undefined) ? { connect: {ID: BUDDY_ID }} : undefined;
         (insertData as Prisma.RefLidCreateInput).Buddy2 = (BUDDY_ID2 !== undefined) ? { connect: {ID: BUDDY_ID2 }} : undefined;

         return await this.ledenService.AddObject(insertData as Prisma.RefLidCreateInput);
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
         // remove LIDTYPE_ID, STATUSTYPE_ID, ZUSTERCLUB_ID, BUDDY_ID, BUDDY_ID2 from the data
         // and add them as connect to the updateData object
         const { LIDTYPE_ID, STATUSTYPE_ID, ZUSTERCLUB_ID, BUDDY_ID, BUDDY_ID2, ...updateData} = data;
         (updateData as Prisma.RefLidCreateInput).LidType = LIDTYPE_ID ? { connect: {ID: LIDTYPE_ID }} : undefined;
         (updateData as Prisma.RefLidCreateInput).VliegStatus = STATUSTYPE_ID ? { connect: {ID: STATUSTYPE_ID }} : undefined;
         (updateData as Prisma.RefLidCreateInput).Zusterclub = ZUSTERCLUB_ID ? { connect: {ID: ZUSTERCLUB_ID }} : undefined;
         (updateData as Prisma.RefLidCreateInput).Buddy = BUDDY_ID ? { connect: {ID: BUDDY_ID }} : undefined;
         (updateData as Prisma.RefLidCreateInput).Buddy2 = BUDDY_ID2 ? { connect: {ID: BUDDY_ID2 }} : undefined;

         return await this.ledenService.UpdateObject(id, updateData as Prisma.RefLidUpdateInput);
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
