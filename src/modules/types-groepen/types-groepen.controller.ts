import {
   Body,
   Controller,
   HttpException,
   HttpStatus,
   Query
} from '@nestjs/common';
import {TypesGroepenService} from "./types-groepen.service";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {GetObjectRequest} from "../../core/DTO/IHeliosFilter";
import {
   HeliosController, HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject,
   HeliosRestoreObject, HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {RefTypesGroepDto} from "../../generated/nestjs-dto/refTypesGroep.dto";
import {GetObjectsRefTypesGroepenRequest} from "./GetObjectsRefTypesGroepenRequest";
import {Prisma, RefLid, RefTypesGroep} from "@prisma/client";
import {CurrentUser} from "../login/current-user.decorator";
import {ApiTags} from "@nestjs/swagger";
import {GetObjectsRefTypesGroepenResponse} from "./GetObjectsRefTypesGroepenResponse";
import {PermissieService} from "../authorisatie/permissie.service";
import {CreateRefTypesGroepDto} from "../../generated/nestjs-dto/create-refTypesGroep.dto";
import {UpdateRefTypesGroepDto} from "../../generated/nestjs-dto/update-refTypesGroep.dto";

@Controller('TypesGroepen')
@ApiTags('TypesGroepen')
export class TypesGroepenController extends HeliosController
{
   constructor(private readonly permissieService:PermissieService,
               private readonly typesGroepenService: TypesGroepenService)
   {
      super()
   }

   @HeliosGetObject(RefTypesGroepDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectRequest): Promise<RefTypesGroepDto>
   {
      this.permissieService.heeftToegang(user, 'TypesGroepen.GetObject');

      const obj =  await this.typesGroepenService.GetObject(queryParams.ID);
      if (!obj)
         throw new HttpException(`Record with ID ${queryParams.ID} not found`, HttpStatus.NOT_FOUND);

      return obj;
   }

   @HeliosGetObjects(GetObjectsRefTypesGroepenResponse)
   GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsRefTypesGroepenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsRefTypesGroepenResponse>>
   {
      this.permissieService.heeftToegang(user, 'TypesGroepen.GetObjects');
      return this.typesGroepenService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateRefTypesGroepDto, RefTypesGroepDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateRefTypesGroepDto): Promise<RefTypesGroepDto>
   {
      this.permissieService.heeftToegang(user, 'TypesGroepen.AddObject');
      try
      {
         return await this.typesGroepenService.AddObject(data);
      }
      catch (e)
      {
         this.handlePrismaError(e)
      }
   }

   @HeliosUpdateObject(UpdateRefTypesGroepDto, RefTypesGroepDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateRefTypesGroepDto): Promise<RefTypesGroep>
   {
      this.permissieService.heeftToegang(user, 'TypesGroepen.UpdateObject');
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
      this.permissieService.heeftToegang(user, 'TypesGroepen.DeleteObject');

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
      this.permissieService.heeftToegang(user, 'TypesGroepen.RemoveObject');
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
      this.permissieService.heeftToegang(user, 'TypesGroepen.RestoreObject');
      const data: Prisma.RefTypesGroepUpdateInput = {
         VERWIJDERD: false
      }
      await this.typesGroepenService.UpdateObject(id, data);
   }
}
