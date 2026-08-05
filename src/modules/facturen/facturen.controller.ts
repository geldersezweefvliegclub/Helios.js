import {Body, Controller, Logger, Query} from '@nestjs/common';
import {FacturenService} from "./facturen.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperFactuurDto} from "../../generated/nestjs-dto/operFactuur.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperFacturenResponse} from "./GetObjectsOperFacturenResponse";
import {GetObjectsOperFacturenRequest} from "./GetObjectsOperFacturenRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperFactuurDto} from "../../generated/nestjs-dto/create-operFactuur.dto";
import {UpdateOperFactuurDto} from "../../generated/nestjs-dto/update-operFactuur.dto";
import {ApiTags} from "@nestjs/swagger";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";

@Controller('Facturen')
@ApiTags('Facturen')
export class FacturenController  extends HeliosController
{
   private readonly logger = new Logger(FacturenController.name);

   constructor(private readonly FacturenService: FacturenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperFactuurDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperFactuurDto>
   {
      this.logger.verbose(`FacturenController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Facturen.GetObject');
      return await this.FacturenService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperFacturenResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperFacturenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperFacturenResponse>>
   {
      this.logger.verbose(`FacturenController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Facturen.GetObjects');
      return await this.FacturenService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperFactuurDto, OperFactuurDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperFactuurDto): Promise<OperFactuurDto>
   {
      this.logger.verbose(`FacturenController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'Facturen.AddObject');

      const insert = await this.normaliserenData(data) as Prisma.OperFactuurCreateInput;
      return await this.FacturenService.AddObject(insert, currentUser.ID);
   }

   @HeliosUpdateObject(UpdateOperFactuurDto, OperFactuurDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperFactuurDto): Promise<OperFactuurDto>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`FacturenController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Facturen.UpdateObject');

      const update = await this.normaliserenData(data) as Prisma.OperFactuurUpdateInput;
      return await this.FacturenService.UpdateObject(id, update, currentUser.ID);
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden
   private async normaliserenData(
      data: CreateOperFactuurDto | UpdateOperFactuurDto): Promise<Prisma.OperFactuurCreateInput | Prisma.OperFactuurUpdateInput>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      return data as Prisma.OperFactuurCreateInput | Prisma.OperFactuurUpdateInput;
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`FacturenController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Facturen.DeleteObject');

      const data: Prisma.OperFactuurUpdateInput = {
         VERWIJDERD: true
      }
      await this.FacturenService.UpdateObject(id, data, currentUser.ID);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`FacturenController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Facturen.RemoveObject');
      await this.FacturenService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`FacturenController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Facturen.RestoreObject');

      const data: Prisma.OperFactuurUpdateInput = {
         VERWIJDERD: false
      }
      await this.FacturenService.UpdateObject(id, data, currentUser.ID);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}