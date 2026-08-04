import {Body, Controller, Logger, Query} from '@nestjs/common';
import {TypesService} from "./types.service";
import {Prisma, RefLid} from '@prisma/client';
import {GetObjectsRefTypesRequest} from "./GetObjectsRefTypesRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {
   HeliosController,
   HeliosCreateObject,
   HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects,
   HeliosRemoveObject,
   HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {CreateRefTypeDto} from "../../generated/nestjs-dto/create-refType.dto";
import {UpdateRefTypeDto} from "../../generated/nestjs-dto/update-refType.dto";
import {RefTypeDto} from "../../generated/nestjs-dto/refType.dto";
import {ApiTags} from "@nestjs/swagger";
import {GetRefTypesResponse} from "./GetRefTypesResponse";
import {CurrentUser} from "../login/current-user.decorator";
import {PermissieService} from "../authorisatie/permissie.service";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";

@Controller('Types')
@ApiTags('Types')
export class TypesController extends HeliosController
{
   private readonly logger = new Logger(TypesController.name);

   constructor(private readonly typesService: TypesService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(GetRefTypesResponse)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<GetRefTypesResponse>
   {
      this.logger.verbose(`TypesController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Types.GetObject');
      return await this.typesService.GetObject(id);
   }

   @HeliosGetObjects(GetRefTypesResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsRefTypesRequest): Promise<IHeliosGetObjectsResponse<GetRefTypesResponse>>
   {
      this.logger.verbose(`TypesController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Types.GetObjects');
      return await this.typesService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateRefTypeDto, GetRefTypesResponse)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateRefTypeDto): Promise<GetRefTypesResponse>
   {
      this.logger.verbose(`TypesController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'Types.AddObject');

      // verwijder GROEP uit de data
      // en voeg het toe aan de TypesGroep property
      const { GROEP, ...insertData} = data;
      const insert = insertData as Prisma.RefTypeCreateInput;
      insert.TypesGroep = GROEP ? { connect: { ID: GROEP } } : undefined;

      return await this.typesService.AddObject(insert);
   }

   @HeliosUpdateObject(UpdateRefTypeDto, RefTypeDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateRefTypeDto): Promise<RefTypeDto>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`TypesController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Types.UpdateObject');

      // verwijder GROEP uit de data
      // en voeg het toe aan de TypesGroep property
      const { GROEP, ...updateData} = data;
      const update = updateData as Prisma.RefTypeUpdateInput;
      update.TypesGroep = (GROEP !== undefined) ? { connect: { ID: GROEP } } : undefined;

      return await this.typesService.UpdateObject(id, update);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`TypesController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Types.DeleteObject');

      const data: Prisma.RefTypeUpdateInput = {
         VERWIJDERD: true
      }
      await this.typesService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`TypesController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Types.RemoveObject');
      await this.typesService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`TypesController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Types.RestoreObject');

      const data: Prisma.RefTypeUpdateInput = {
         VERWIJDERD: false
      }
      await this.typesService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}
