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

      const insert = await this.normaliserenData(data) as Prisma.RefVliegtuigCreateInput;
      return await this.vliegtuigenService.AddObject(insert, currentUser.ID);
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

      const update = await this.normaliserenData(data) as Prisma.RefVliegtuigUpdateInput;
      return await this.vliegtuigenService.UpdateObject(id, update, currentUser.ID);
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden en zet
   // TYPE_ID om naar een relatie-connect
   private async normaliserenData(
      data: CreateRefVliegtuigDto | UpdateRefVliegtuigDto): Promise<Prisma.RefVliegtuigCreateInput | Prisma.RefVliegtuigUpdateInput>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert
      // de DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      // verwijder TYPE_ID uit de data
      // en voeg het toe als connect aan het insert-/updateData object
      const { TYPE_ID, ...rest } = data;
      const result = rest as Prisma.RefVliegtuigCreateInput | Prisma.RefVliegtuigUpdateInput;
      result.VliegtuigType = TYPE_ID !== undefined ? { connect: { ID: TYPE_ID } } : undefined;

      return result;
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
      await this.vliegtuigenService.UpdateObject(id, data, currentUser.ID);
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
      await this.vliegtuigenService.UpdateObject(id, data, currentUser.ID);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}
