import {
   Body,
   Controller,
   Query
} from '@nestjs/common';
import {TypesService} from "./types.service";
import {Prisma, RefLid, RefType} from '@prisma/client';
import {GetObjectsRefTypesRequest} from "./GetObjectsRefTypesRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {GetObjectRequest} from "../../core/DTO/IHeliosFilter";
import {
   HeliosController, HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject,
   HeliosRestoreObject, HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {CreateRefTypeDto} from "../../generated/nestjs-dto/create-refType.dto";
import {UpdateRefTypeDto} from "../../generated/nestjs-dto/update-refType.dto";
import {RefTypeDto} from "../../generated/nestjs-dto/refType.dto";
import {ApiTags} from "@nestjs/swagger";
import {GetObjectsRefTypesResponse} from "./GetObjectsRefTypesResponse";
import {CurrentUser} from "../login/current-user.decorator";
import {PermissieService} from "../authorisatie/permissie.service";

@Controller('Types')
@ApiTags('Types')
export class TypesController extends HeliosController
{
   constructor(private readonly typesService: TypesService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(RefTypeDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<RefTypeDto>
   {
      this.permissieService.heeftToegang(user, 'Types.GetObject');
      return await this.typesService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsRefTypesResponse)
   GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsRefTypesRequest): Promise<IHeliosGetObjectsResponse<GetObjectsRefTypesResponse>>
   {
      this.permissieService.heeftToegang(user, 'Types.GetObjects');
      return this.typesService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateRefTypeDto, RefTypeDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateRefTypeDto): Promise<RefTypeDto>
   {
      this.permissieService.heeftToegang(user, 'Types.AddObject');

      // remove TYPEGROEP_ID from the data
      // and add it to the TypesGroep property
      const { TYPEGROEP_ID, ...insertData} = data;
      (insertData as Prisma.RefTypeCreateInput).TypesGroep = TYPEGROEP_ID ? { connect: {ID: TYPEGROEP_ID }} : undefined

      return await this.typesService.AddObject(insertData as Prisma.RefTypeCreateInput);
   }

   @HeliosUpdateObject(UpdateRefTypeDto, RefTypeDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateRefTypeDto): Promise<RefType>
   {
      this.permissieService.heeftToegang(user, 'Types.UpdateObject');

      // remove TYPEGROEP_ID from the data
      // and add it to the TypesGroep property
      const { TYPEGROEP_ID, ...updateData} = data;
      (updateData as Prisma.RefTypeCreateInput).TypesGroep = (TYPEGROEP_ID !== undefined) ? { connect: {ID: TYPEGROEP_ID }} : undefined

      return await this.typesService.UpdateObject(id, updateData as Prisma.RefTypeCreateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Types.DeleteObject');

      const data: Prisma.RefTypeUpdateInput = {
         VERWIJDERD: true
      }
      await this.typesService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Types.RemoveObject');
      await this.typesService.RemoveObject(id);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Types.RestoreObject');

      const data: Prisma.RefTypeUpdateInput = {
         VERWIJDERD: false
      }
      await this.typesService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}
