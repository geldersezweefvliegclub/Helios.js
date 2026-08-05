import {Body, Controller, Logger, Query} from '@nestjs/common';
import {RoosterService} from "./rooster.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperRoosterDto} from "../../generated/nestjs-dto/operRooster.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperRoosterResponse} from "./GetObjectsOperRoosterResponse";
import {GetObjectsOperRoosterRequest} from "./GetObjectsOperRoosterRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperRoosterDto} from "../../generated/nestjs-dto/create-operRooster.dto";
import {UpdateOperRoosterDto} from "../../generated/nestjs-dto/update-operRooster.dto";
import {ApiTags} from "@nestjs/swagger";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {parseDateOnly, toDateOnly} from "../../core/helpers/DateOnly";

@Controller('Rooster')
@ApiTags('Rooster')
export class RoosterController  extends HeliosController
{
   private readonly logger = new Logger(RoosterController.name);

   constructor(private readonly RoosterService: RoosterService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperRoosterDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperRoosterDto>
   {
      this.logger.verbose(`RoosterController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Rooster.GetObject');
      const obj = await this.RoosterService.GetObject(id);
      return {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
   }

   @HeliosGetObjects(GetObjectsOperRoosterResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperRoosterRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperRoosterResponse>>
   {
      this.logger.verbose(`RoosterController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Rooster.GetObjects');
      return await this.RoosterService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperRoosterDto, OperRoosterDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperRoosterDto): Promise<OperRoosterDto>
   {
      this.logger.verbose(`RoosterController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'Rooster.AddObject');

      const insert = await this.normaliserenData(data) as CreateOperRoosterDto;
      const obj = await this.RoosterService.AddObject(insert as Prisma.OperRoosterCreateInput, currentUser.ID);
      return {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
   }

   @HeliosUpdateObject(UpdateOperRoosterDto, OperRoosterDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperRoosterDto): Promise<OperRoosterDto>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`RoosterController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Rooster.UpdateObject');

      const update = await this.normaliserenData(data) as UpdateOperRoosterDto;
      const obj = await this.RoosterService.UpdateObject(id, update as Prisma.OperRoosterCreateInput, currentUser.ID);
      return {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden en normaliseert
   // de DATUM (enkel een kalenderdatum, geen tijd) naar een geldig Date object
   private async normaliserenData(
      data: CreateOperRoosterDto | UpdateOperRoosterDto): Promise<CreateOperRoosterDto | UpdateOperRoosterDto>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert
      // de DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      // DATUM is optioneel op de update-DTO maar verplicht op de create-DTO: cast om deze union-brede
      // toewijzing toe te staan
      (data as Pick<CreateOperRoosterDto, "DATUM">).DATUM = parseDateOnly(data.DATUM as Date | string) as Date;

      return data;
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`RoosterController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Rooster.DeleteObject');

      const data: Prisma.OperRoosterUpdateInput = {
         VERWIJDERD: true
      }
      await this.RoosterService.UpdateObject(id, data, currentUser.ID);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`RoosterController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Rooster.RemoveObject');
      await this.RoosterService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`RoosterController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Rooster.RestoreObject');

      const data: Prisma.OperRoosterUpdateInput = {
         VERWIJDERD: false
      }
      await this.RoosterService.UpdateObject(id, data, currentUser.ID);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}