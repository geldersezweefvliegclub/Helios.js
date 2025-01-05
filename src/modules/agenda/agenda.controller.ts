import {Body, Controller, HttpException, HttpStatus, Query} from '@nestjs/common';
import {ApiTags} from "@nestjs/swagger";
import {AgendaService} from "../agenda/agenda.service";
import {LedenService} from "../leden/leden.service";
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
import {GetObjectRequest} from "../../core/DTO/IHeliosFilter";
import {GetObjectsOperAgendaResponse} from "../agenda/GetObjectsOperAgendaResponse";
import {GetObjectsOperAgendaRequest} from "../agenda/GetObjectsOperAgendaRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsReponse";
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
      const obj =  await this.agendaService.GetObject(id);
      if (!obj)
         throw new HttpException(`Record with ID ${id} not found`, HttpStatus.NOT_FOUND);

      return obj;
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
      try
      {
         return await this.agendaService.AddObject(data as Prisma.OperAgendaCreateInput);
      }
      catch (e)
      {
         this.handlePrismaError(e)
      }
   }

@HeliosUpdateObject(UpdateOperAgendaDto, OperAgendaDto)
async UpdateObject(
   @CurrentUser() user: RefLid,
   @Query('ID') id: number, @Body() data: UpdateOperAgendaDto): Promise<OperAgendaDto>
   {
      this.permissieService.heeftToegang(user, 'Agenda.UpdateObject');
      try
      {
         return await this.agendaService.UpdateObject(id, data as Prisma.OperAgendaCreateInput);
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
      this.permissieService.heeftToegang(user, 'Agenda.DeleteObject');

      const data: Prisma.OperAgendaUpdateInput = {
         VERWIJDERD: true
      }
      try
      {
         await this.agendaService.UpdateObject(id, data);
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
      this.permissieService.heeftToegang(user, 'Agenda.RemoveObject');
      try
      {
         await this.agendaService.RemoveObject(id);
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
      this.permissieService.heeftToegang(user, 'Agenda.RestoreObject');

      const data: Prisma.OperAgendaUpdateInput = {
         VERWIJDERD: false
      }
      await this.agendaService.UpdateObject(id, data);
   }
}