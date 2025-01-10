import {Body, Controller, Query} from '@nestjs/common';
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

@Controller('Agenda')
@ApiTags('Agenda')
export class AgendaController extends HeliosController
{
   constructor(private readonly agendaService: AgendaService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

@HeliosGetObject(OperAgendaDto)
async GetObject(
   @CurrentUser() user: RefLid,
   @Query('ID') id: number): Promise<OperAgendaDto>
   {
      this.permissieService.heeftToegang(user, 'Agenda.GetObject');
      return await this.agendaService.GetObject(id);
   }

@HeliosGetObjects(GetObjectsOperAgendaResponse)
   GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsOperAgendaRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperAgendaResponse>>
   {
      this.permissieService.heeftToegang(user, 'Agenda.GetObjects');
      return this.agendaService.GetObjects(queryParams);
   }

@HeliosCreateObject(CreateOperAgendaDto, OperAgendaDto)
async AddObject(
   @CurrentUser() user: RefLid,
   @Body() data: CreateOperAgendaDto): Promise<OperAgendaDto>
   {
      this.permissieService.heeftToegang(user, 'Agenda.AddObject');
      return await this.agendaService.AddObject(data as Prisma.OperAgendaCreateInput);
   }

@HeliosUpdateObject(UpdateOperAgendaDto, OperAgendaDto)
async UpdateObject(
   @CurrentUser() user: RefLid,
   @Query('ID') id: number, @Body() data: UpdateOperAgendaDto): Promise<OperAgendaDto>
   {
      this.permissieService.heeftToegang(user, 'Agenda.UpdateObject');
      return await this.agendaService.UpdateObject(id, data as Prisma.OperAgendaCreateInput);
   }

@HeliosDeleteObject()
async DeleteObject(
   @CurrentUser() user: RefLid,
   @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Agenda.DeleteObject');

      const data: Prisma.OperAgendaUpdateInput = {
         VERWIJDERD: true
      }
      await this.agendaService.UpdateObject(id, data);
   }

@HeliosRemoveObject()
async RemoveObject(
   @CurrentUser() user: RefLid,
   @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Agenda.RemoveObject');
      await this.agendaService.RemoveObject(id);
   }

@HeliosRestoreObject()
async RestoreObject(
   @CurrentUser() user: RefLid,
   @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Agenda.RestoreObject');

      const data: Prisma.OperAgendaUpdateInput = {
         VERWIJDERD: false
      }
      await this.agendaService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}