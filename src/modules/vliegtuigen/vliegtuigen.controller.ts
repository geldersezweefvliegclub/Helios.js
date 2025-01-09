import {Body, Controller, HttpException, HttpStatus, Query} from '@nestjs/common';
import {ApiTags} from "@nestjs/swagger";
import {ConfigService} from "@nestjs/config";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject, HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid, RefVliegtuig} from "@prisma/client";
import {GetObjectRequest} from "../../core/DTO/IHeliosFilter";
import {GetObjectsRefVliegtuigenResponse} from "./GetObjectsRefVliegtuigenResponse";
import {GetObjectsRefVliegtuigenRequest} from "./GetObjectsRefVliegtuigenRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {RefVliegtuigDto} from "../../generated/nestjs-dto/refVliegtuig.dto";
import {VliegtuigenService} from "./vliegtuigen.service";
import {CreateRefVliegtuigDto} from "../../generated/nestjs-dto/create-refVliegtuig.dto";
import {UpdateRefVliegtuigDto} from "../../generated/nestjs-dto/update-refVliegtuig.dto";

@Controller('Vliegtuigen')
@ApiTags('Vliegtuigen')
export class VliegtuigenController extends HeliosController
{
   constructor(private readonly configService: ConfigService,
               private readonly vliegtuigenService: VliegtuigenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(RefVliegtuigDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectRequest): Promise<RefVliegtuigDto>
   {
      this.permissieService.heeftToegang(user, 'Vliegtuigen.GetObject');
      const obj =  await this.vliegtuigenService.GetObject(queryParams.ID);
      if (!obj)
         throw new HttpException(`Record with ID ${queryParams.ID} not found`, HttpStatus.NOT_FOUND);

      return obj;
   }

   @HeliosGetObjects(GetObjectsRefVliegtuigenResponse)
   async GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsRefVliegtuigenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsRefVliegtuigenResponse>>
   {
      // check if the user has the right permissions
      this.permissieService.heeftToegang(user, 'Vliegtuigen.GetObjects');
      
      // retrieve the objects from the database based on the query parameters
      return await this.vliegtuigenService.GetObjects (queryParams);
   }

   @HeliosCreateObject(CreateRefVliegtuigDto, RefVliegtuigDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateRefVliegtuigDto): Promise<RefVliegtuigDto>
   {
      this.permissieService.heeftToegang(user, 'Vliegtuigen.AddObject');
      try
      {
         // remove TYPE_ID from the data
         // and add them as connect to the insertData object
         const { TYPE_ID, ...insertData} = data;
         (insertData as Prisma.RefVliegtuigCreateInput).VliegtuigType = (TYPE_ID !== undefined) ? { connect: {ID: TYPE_ID }} : undefined;

         return await this.vliegtuigenService.AddObject(insertData as Prisma.RefVliegtuigCreateInput);
      }
      catch (e)
      {
         this.handlePrismaError(e)
      }
   }

   @HeliosUpdateObject(UpdateRefVliegtuigDto, RefVliegtuigDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateRefVliegtuigDto): Promise<RefVliegtuig>
   {
      this.permissieService.heeftToegang(user, 'Vliegtuigen.UpdateObject');

      try
      {
         // remove TYPE_ID from the data
         // and add them as connect to the updateData object
         const { TYPE_ID, ...updateData} = data;
         (updateData as Prisma.RefVliegtuigCreateInput).VliegtuigType = TYPE_ID ? { connect: {ID: TYPE_ID }} : undefined;

         return await this.vliegtuigenService.UpdateObject(id, updateData as Prisma.RefVliegtuigUpdateInput);
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
      this.permissieService.heeftToegang(user, 'Vliegtuigen.DeleteObject');

      const data: Prisma.RefVliegtuigUpdateInput = {
         VERWIJDERD: true
      }
      try
      {
         await this.vliegtuigenService.UpdateObject(id, data);
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
      this.permissieService.heeftToegang(user, 'Vliegtuigen.RemoveObject');

      try
      {
         await this.vliegtuigenService.RemoveObject(id);
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
      this.permissieService.heeftToegang(user, 'Vliegtuigen.RestoreObject');

      const data: Prisma.RefLidUpdateInput = {
         VERWIJDERD: false
      }
      await this.vliegtuigenService.UpdateObject(id, data);
   }
}
