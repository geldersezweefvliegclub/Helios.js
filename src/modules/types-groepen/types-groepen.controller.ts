import {
   Body,
   Controller,
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
      @Query('ID') id: number): Promise<RefTypesGroepDto>
   {
      this.permissieService.heeftToegang(user, 'TypesGroepen.GetObject');
      return  await this.typesGroepenService.GetObject(id);
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
      return await this.typesGroepenService.AddObject(data);
   }

   @HeliosUpdateObject(UpdateRefTypesGroepDto, RefTypesGroepDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateRefTypesGroepDto): Promise<RefTypesGroep>
   {
      this.permissieService.heeftToegang(user, 'TypesGroepen.UpdateObject');
      return await this.typesGroepenService.UpdateObject(id, data);
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
      await this.typesGroepenService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'TypesGroepen.RemoveObject');
      await this.typesGroepenService.RemoveObject(id);
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

   //------------- Specifieke endpoints staan hieronder --------------------//


}
