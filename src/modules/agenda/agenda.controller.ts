import {Body, Controller, Logger, Query} from '@nestjs/common';
import {ApiTags} from "@nestjs/swagger";
import {AgendaService} from "./agenda.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperAgendaDto} from "../../generated/nestjs-dto/operAgenda.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperAgendaResponse} from "./GetObjectsOperAgendaResponse";
import {GetObjectsOperAgendaRequest} from "./GetObjectsOperAgendaRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperAgendaDto} from "../../generated/nestjs-dto/create-operAgenda.dto";
import {UpdateOperAgendaDto} from "../../generated/nestjs-dto/update-operAgenda.dto";
import {safeStringify} from "../../core/helpers/LogHelper";

@Controller('Agenda')
@ApiTags('Agenda')
export class AgendaController extends HeliosController
{
   private readonly logger = new Logger(AgendaController.name);

   constructor(private readonly agendaService: AgendaService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

@HeliosGetObject(OperAgendaDto)
async GetObject(
   @CurrentUser() currentUser: RefLid,
   @Query('ID') id: number): Promise<OperAgendaDto>
   {
      this.logger.verbose(`AgendaController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Agenda.GetObject');
      return await this.agendaService.GetObject(id);
   }

@HeliosGetObjects(GetObjectsOperAgendaResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperAgendaRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperAgendaResponse>>
   {
      this.logger.verbose(`AgendaController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Agenda.GetObjects');
      return await this.agendaService.GetObjects(queryParams);
   }

@HeliosCreateObject(CreateOperAgendaDto, OperAgendaDto)
async AddObject(
   @CurrentUser() currentUser: RefLid,
   @Body() data: CreateOperAgendaDto): Promise<OperAgendaDto>
   {
      this.logger.verbose(`AgendaController.AddObject(${safeStringify({currentUser, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Agenda.AddObject');
      return await this.agendaService.AddObject(data as Prisma.OperAgendaCreateInput);
   }

@HeliosUpdateObject(UpdateOperAgendaDto, OperAgendaDto)
async UpdateObject(
   @CurrentUser() currentUser: RefLid,
   @Query('ID') id: number, @Body() data: UpdateOperAgendaDto): Promise<OperAgendaDto>
   {
      this.logger.verbose(`AgendaController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Agenda.UpdateObject');
      return await this.agendaService.UpdateObject(id, data as Prisma.OperAgendaCreateInput);
   }

@HeliosDeleteObject()
async DeleteObject(
   @CurrentUser() currentUser: RefLid,
   @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`AgendaController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Agenda.DeleteObject');

      const data: Prisma.OperAgendaUpdateInput = {
         VERWIJDERD: true
      }
      await this.agendaService.UpdateObject(id, data);
   }

@HeliosRemoveObject()
async RemoveObject(
   @CurrentUser() currentUser: RefLid,
   @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`AgendaController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Agenda.RemoveObject');
      await this.agendaService.RemoveObject(id, currentUser.ID);
   }

@HeliosRestoreObject()
async RestoreObject(
   @CurrentUser() currentUser: RefLid,
   @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`AgendaController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Agenda.RestoreObject');

      const data: Prisma.OperAgendaUpdateInput = {
         VERWIJDERD: false
      }
      await this.agendaService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}