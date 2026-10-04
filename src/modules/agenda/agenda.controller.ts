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
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {parseDateOnly, parseTimeOnly, toDateOnly, toTimeOnly} from "../../core/helpers/TimeDate";

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
      this.heeftDataToegangGetObject(currentUser);
      const obj = await this.agendaService.GetObject(id);
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         TIJD: toTimeOnly(obj.TIJD) as unknown as Date,
      };
   }

@HeliosGetObjects(GetObjectsOperAgendaResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperAgendaRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperAgendaResponse>>
   {
      this.logger.verbose(`AgendaController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Agenda.GetObjects');
      this.heeftDataToegangGetObjects(currentUser);
      return await this.agendaService.GetObjects(queryParams);
   }

@HeliosCreateObject(CreateOperAgendaDto, OperAgendaDto)
async AddObject(
   @CurrentUser() currentUser: RefLid,
   @Body() data: CreateOperAgendaDto): Promise<OperAgendaDto>
   {
      this.logger.verbose(`AgendaController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'Agenda.AddObject');
      this.heeftDataToegangAddObject(currentUser);

      const insert = await this.normaliserenData(data) as Prisma.OperAgendaUncheckedCreateInput;
      const obj = await this.agendaService.AddObject(insert, currentUser.ID);
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         TIJD: toTimeOnly(obj.TIJD) as unknown as Date,
      };
   }

@HeliosUpdateObject(UpdateOperAgendaDto, OperAgendaDto)
async UpdateObject(
   @CurrentUser() currentUser: RefLid,
   @Query('ID') id: number, @Body() data: UpdateOperAgendaDto): Promise<OperAgendaDto>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`AgendaController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Agenda.UpdateObject');
      this.heeftDataToegangUpdateObject(currentUser);

      const update = await this.normaliserenData(data) as Prisma.OperAgendaUncheckedUpdateInput;
      const obj = await this.agendaService.UpdateObject(id, update, currentUser.ID);
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         TIJD: toTimeOnly(obj.TIJD) as unknown as Date,
      };
   }

@HeliosDeleteObject()
async DeleteObject(
   @CurrentUser() currentUser: RefLid,
   @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`AgendaController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Agenda.DeleteObject');
      this.heeftDataToegangDeleteObject(currentUser);

      const data: Prisma.OperAgendaUncheckedUpdateInput = {
         VERWIJDERD: true
      }
      await this.agendaService.UpdateObject(id, data, currentUser.ID);
   }

@HeliosRemoveObject()
async RemoveObject(
   @CurrentUser() currentUser: RefLid,
   @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`AgendaController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Agenda.RemoveObject');
      this.heeftDataToegangRemoveObject(currentUser);
      await this.agendaService.RemoveObject(id, currentUser.ID);
   }

@HeliosRestoreObject()
async RestoreObject(
   @CurrentUser() currentUser: RefLid,
   @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`AgendaController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Agenda.RestoreObject');
      this.heeftDataToegangRestoreObject(currentUser);

      const data: Prisma.OperAgendaUncheckedUpdateInput = {
         VERWIJDERD: false
      }
      await this.agendaService.UpdateObject(id, data, currentUser.ID);
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden en normaliseert
   // de datum- en tijdvelden
   private async normaliserenData(
      data: CreateOperAgendaDto | UpdateOperAgendaDto): Promise<Prisma.OperAgendaUncheckedCreateInput | Prisma.OperAgendaUncheckedUpdateInput>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      data.DATUM = parseDateOnly(data.DATUM as Date | string) as Date;
      data.TIJD = parseTimeOnly(data.TIJD as Date | string | null);

      return data as Prisma.OperAgendaUncheckedCreateInput | Prisma.OperAgendaUncheckedUpdateInput;
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

   // controleer of de gebruiker toegang heeft tot de data van Agenda/GetObject
   private heeftDataToegangGetObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Agenda/GetObjects
   private heeftDataToegangGetObjects(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Agenda/AddObject
   private heeftDataToegangAddObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Agenda/UpdateObject
   private heeftDataToegangUpdateObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Agenda/DeleteObject
   private heeftDataToegangDeleteObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Agenda/RemoveObject
   private heeftDataToegangRemoveObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Agenda/RestoreObject
   private heeftDataToegangRestoreObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }
}
