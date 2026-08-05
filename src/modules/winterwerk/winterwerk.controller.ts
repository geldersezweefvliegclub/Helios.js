
import {Body, Controller, Logger, Query} from '@nestjs/common';
import {ApiTags} from "@nestjs/swagger";
import {WinterwerkService} from "./winterwerk.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperWinterwerkDto} from "../../generated/nestjs-dto/operWinterwerk.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperWinterwerkResponse} from "./GetObjectsOperWinterwerkResponse";
import {GetObjectsOperWinterwerkRequest} from "./GetObjectsOperWinterwerkRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperWinterwerkDto} from "../../generated/nestjs-dto/create-operWinterwerk.dto";
import {UpdateOperWinterwerkDto} from "../../generated/nestjs-dto/update-operWinterwerk.dto";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {parseDateOnly, parseTimeOnly, toDateOnly, toTimeOnly} from "../../core/helpers/DateOnly";

@Controller('Winterwerk')
@ApiTags('Winterwerk')
export class WinterwerkController extends HeliosController
{
   private readonly logger = new Logger(WinterwerkController.name);

   constructor(private readonly WinterwerkService: WinterwerkService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperWinterwerkDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperWinterwerkDto>
   {
      this.logger.verbose(`WinterwerkController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Winterwerk.GetObject');
      const obj = await this.WinterwerkService.GetObject(id);
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         AANVANG: toTimeOnly(obj.AANVANG) as unknown as Date,
         EINDE: toTimeOnly(obj.EINDE) as unknown as Date,
      };
   }

   @HeliosGetObjects(GetObjectsOperWinterwerkResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperWinterwerkRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperWinterwerkResponse>>
   {
      this.logger.verbose(`WinterwerkController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Winterwerk.GetObjects');
      return await this.WinterwerkService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperWinterwerkDto, OperWinterwerkDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperWinterwerkDto): Promise<OperWinterwerkDto>
   {
      this.logger.verbose(`WinterwerkController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'Winterwerk.AddObject');

      const insert = await this.normaliserenData(data) as Prisma.OperWinterwerkCreateInput;
      const obj = await this.WinterwerkService.AddObject(insert, currentUser.ID);
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         AANVANG: toTimeOnly(obj.AANVANG) as unknown as Date,
         EINDE: toTimeOnly(obj.EINDE) as unknown as Date,
      };
   }

   @HeliosUpdateObject(UpdateOperWinterwerkDto, OperWinterwerkDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperWinterwerkDto): Promise<OperWinterwerkDto>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`WinterwerkController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Winterwerk.UpdateObject');

      const update = await this.normaliserenData(data) as Prisma.OperWinterwerkUpdateInput;
      const obj = await this.WinterwerkService.UpdateObject(id, update, currentUser.ID);
      return {
         ...obj,
         DATUM: toDateOnly(obj.DATUM) as unknown as Date,
         AANVANG: toTimeOnly(obj.AANVANG) as unknown as Date,
         EINDE: toTimeOnly(obj.EINDE) as unknown as Date,
      };
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden en
   // normaliseert de datum- en tijdvelden
   private async normaliserenData(
      data: CreateOperWinterwerkDto | UpdateOperWinterwerkDto): Promise<Prisma.OperWinterwerkCreateInput | Prisma.OperWinterwerkUpdateInput>
   {
      // VERWIJDERD en LAATSTE_AANPASSING zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;

      // zorg dat de datum en tijden omgezet worden in ISO 8601 formaat
      data.DATUM = parseDateOnly(data.DATUM as Date | string) as Date;
      data.AANVANG = parseTimeOnly(data.AANVANG as Date | string) as Date;
      data.EINDE = parseTimeOnly(data.EINDE as Date | string) as Date;

      return data as Prisma.OperWinterwerkCreateInput | Prisma.OperWinterwerkUpdateInput;
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`WinterwerkController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Winterwerk.DeleteObject');

      const data: Prisma.OperWinterwerkUpdateInput = {
         VERWIJDERD: true
      }
      await this.WinterwerkService.UpdateObject(id, data, currentUser.ID);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`WinterwerkController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Winterwerk.RemoveObject');
      await this.WinterwerkService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`WinterwerkController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Winterwerk.RestoreObject');

      const data: Prisma.OperWinterwerkUpdateInput = {
         VERWIJDERD: false
      }
      await this.WinterwerkService.UpdateObject(id, data, currentUser.ID);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}