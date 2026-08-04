import {Body, Controller, Logger, Query} from '@nestjs/common';
import {ApiTags} from "@nestjs/swagger";
import {PermissieService} from "../authorisatie/permissie.service";
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
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetRefVliegtuigenResponse} from "./GetRefVliegtuigenResponse";
import {GetObjectsRefVliegtuigenRequest} from "./GetObjectsRefVliegtuigenRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {RefVliegtuigDto} from "../../generated/nestjs-dto/refVliegtuig.dto";
import {VliegtuigenService} from "./vliegtuigen.service";
import {CreateRefVliegtuigDto} from "../../generated/nestjs-dto/create-refVliegtuig.dto";
import {UpdateRefVliegtuigDto} from "../../generated/nestjs-dto/update-refVliegtuig.dto";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";

@Controller('Vliegtuigen')
@ApiTags('Vliegtuigen')
export class VliegtuigenController extends HeliosController
{
   private readonly logger = new Logger(VliegtuigenController.name);

   constructor(private readonly vliegtuigenService: VliegtuigenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(RefVliegtuigDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<RefVliegtuigDto>
   {
      this.logger.verbose(`VliegtuigenController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Vliegtuigen.GetObject');
      return await this.vliegtuigenService.GetObject(id);
   }

   @HeliosGetObjects(GetRefVliegtuigenResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsRefVliegtuigenRequest): Promise<IHeliosGetObjectsResponse<GetRefVliegtuigenResponse>>
   {
      this.logger.verbose(`VliegtuigenController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Vliegtuigen.GetObjects');
      return await this.vliegtuigenService.GetObjects (queryParams);
   }

   @HeliosCreateObject(CreateRefVliegtuigDto, GetRefVliegtuigenResponse)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateRefVliegtuigDto): Promise<GetRefVliegtuigenResponse>
   {
      this.logger.verbose(`VliegtuigenController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'Vliegtuigen.AddObject');

      // verwijder TYPE_ID uit de data
      // en voeg ze toe als connect aan het insertData object
      const { TYPE_ID, ...insertData} = data;
      const insert = insertData as Prisma.RefVliegtuigCreateInput;
      insert.VliegtuigType = (TYPE_ID !== undefined) ? { connect: { ID: TYPE_ID } } : undefined;

      return await this.vliegtuigenService.AddObject(insert);
   }

   @HeliosUpdateObject(UpdateRefVliegtuigDto, GetRefVliegtuigenResponse)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateRefVliegtuigDto): Promise<GetRefVliegtuigenResponse>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`VliegtuigenController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Vliegtuigen.UpdateObject');

      // verwijder TYPE_ID uit de data
      // en voeg ze toe als connect aan het updateData object
      const { TYPE_ID, ...updateData} = data;
      const update = updateData as Prisma.RefVliegtuigUpdateInput;
      update.VliegtuigType = TYPE_ID ? { connect: { ID: TYPE_ID } } : undefined;

      return await this.vliegtuigenService.UpdateObject(id, update);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`VliegtuigenController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Vliegtuigen.DeleteObject');

      const data: Prisma.RefVliegtuigUpdateInput = {
         VERWIJDERD: true
      }
      await this.vliegtuigenService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`VliegtuigenController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Vliegtuigen.RemoveObject');
      await this.vliegtuigenService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`VliegtuigenController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Vliegtuigen.RestoreObject');

      const data: Prisma.RefVliegtuigUpdateInput = {
         VERWIJDERD: false
      }
      await this.vliegtuigenService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}
