import {Body, Controller, Logger, Query} from '@nestjs/common';
import {DienstenService} from "./diensten.service";
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
import {GetOperDienstenResponse} from "./GetOperDienstenResponse";
import {GetObjectsOperDienstenRequest} from "./GetObjectsOperDienstenRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperDienstDto} from "../../generated/nestjs-dto/create-operDienst.dto";
import {UpdateOperDienstDto} from "../../generated/nestjs-dto/update-operDienst.dto";
import {ApiTags} from "@nestjs/swagger";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {parseDateOnly} from "../../core/helpers/DateOnly";

@Controller('Diensten')
@ApiTags('Diensten')
export class DienstenController  extends HeliosController
{
   private readonly logger = new Logger(DienstenController.name);

   constructor(private readonly DienstenService: DienstenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(GetOperDienstenResponse)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<GetOperDienstenResponse>
   {
      this.logger.verbose(`DienstenController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Diensten.GetObject');
      return await this.DienstenService.GetObject(id);
   }

   @HeliosGetObjects(GetOperDienstenResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperDienstenRequest): Promise<IHeliosGetObjectsResponse<GetOperDienstenResponse>>
   {
      this.logger.verbose(`DienstenController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Diensten.GetObjects');
      return await this.DienstenService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperDienstDto, GetOperDienstenResponse)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperDienstDto): Promise<GetOperDienstenResponse>
   {
      this.logger.verbose(`DienstenController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'Diensten.AddObject');

      const insert = await this.normaliserenData(data) as Prisma.OperDienstCreateInput;
      return await this.DienstenService.AddObject(insert, currentUser.ID);
   }

   @HeliosUpdateObject(UpdateOperDienstDto, GetOperDienstenResponse)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperDienstDto): Promise<GetOperDienstenResponse>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`DienstenController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Diensten.UpdateObject');

      const update = await this.normaliserenData(data) as Prisma.OperDienstUpdateInput;
      return await this.DienstenService.UpdateObject(id, update, currentUser.ID);
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden en
   // normaliseert het datumveld
   private async normaliserenData(
      data: CreateOperDienstDto | UpdateOperDienstDto): Promise<Prisma.OperDienstCreateInput | Prisma.OperDienstUpdateInput>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      // zorg dat de datum omgezet wordt in ISO 8601 formaat
      data.DATUM = parseDateOnly(data.DATUM as Date | string) as Date;

      return data as Prisma.OperDienstCreateInput | Prisma.OperDienstUpdateInput;
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DienstenController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Diensten.DeleteObject');

      const data: Prisma.OperDienstUpdateInput = {
         VERWIJDERD: true
      }
      await this.DienstenService.UpdateObject(id, data, currentUser.ID);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DienstenController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Diensten.RemoveObject');
      await this.DienstenService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DienstenController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Diensten.RestoreObject');

      const data: Prisma.OperDienstUpdateInput = {
         VERWIJDERD: false
      }
      await this.DienstenService.UpdateObject(id, data, currentUser.ID);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}