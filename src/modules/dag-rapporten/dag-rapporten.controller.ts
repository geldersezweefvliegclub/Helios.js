import {Body, Controller, Logger, Query} from '@nestjs/common';
import {DagRapportenService} from "./dag-rapporten.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperDagRapportDto} from "../../generated/nestjs-dto/operDagRapport.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperDagRapportenResponse} from "./GetObjectsOperDagRapportenResponse";
import {GetObjectsOperDagRapportenRequest} from "./GetObjectsOperDagRapportenRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperDagRapportDto} from "../../generated/nestjs-dto/create-operDagRapport.dto";
import {UpdateOperDagRapportDto} from "../../generated/nestjs-dto/update-operDagRapport.dto";
import {ApiTags} from "@nestjs/swagger";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {parseDateOnly, toDateOnly} from "../../core/helpers/DateOnly";

@Controller('DagRapporten')
@ApiTags('DagRapporten')
export class DagRapportenController extends HeliosController
{
   private readonly logger = new Logger(DagRapportenController.name);

   constructor(private readonly DagRapportenService: DagRapportenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperDagRapportDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperDagRapportDto>
   {
      this.logger.verbose(`DagRapportenController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'DagRapporten.GetObject');
      const obj = await this.DagRapportenService.GetObject(id);
      return {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
   }

   @HeliosGetObjects(GetObjectsOperDagRapportenResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperDagRapportenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperDagRapportenResponse>>
   {
      this.logger.verbose(`DagRapportenController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'DagRapporten.GetObjects');
      return await this.DagRapportenService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperDagRapportDto, OperDagRapportDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperDagRapportDto): Promise<OperDagRapportDto>
   {
      this.logger.verbose(`DagRapportenController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'DagRapporten.AddObject');

      const insert = await this.normaliserenData(data) as Prisma.OperDagRapportCreateInput;
      const obj = await this.DagRapportenService.AddObject(insert, currentUser.ID);
      return {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
   }

   @HeliosUpdateObject(UpdateOperDagRapportDto, OperDagRapportDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperDagRapportDto): Promise<OperDagRapportDto>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`DagRapportenController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'DagRapporten.UpdateObject');

      const update = await this.normaliserenData(data) as Prisma.OperDagRapportUpdateInput;
      const obj = await this.DagRapportenService.UpdateObject(id, update, currentUser.ID);
      return {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden en
   // normaliseert het datumveld
   private async normaliserenData(
      data: CreateOperDagRapportDto | UpdateOperDagRapportDto): Promise<Prisma.OperDagRapportCreateInput | Prisma.OperDagRapportUpdateInput>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      // zorg dat de datum omgezet wordt in ISO 8601 formaat
      data.DATUM = parseDateOnly(data.DATUM as Date | string) as Date;

      return data as Prisma.OperDagRapportCreateInput | Prisma.OperDagRapportUpdateInput;
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DagRapportenController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'DagRapporten.DeleteObject');

      const data: Prisma.OperDagRapportUpdateInput = {
         VERWIJDERD: true
      }
      await this.DagRapportenService.UpdateObject(id, data, currentUser.ID);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DagRapportenController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'DagRapporten.RemoveObject');
      await this.DagRapportenService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DagRapportenController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'DagRapporten.RestoreObject');

      const data: Prisma.OperDagRapportUpdateInput = {
         VERWIJDERD: false
      }
      await this.DagRapportenService.UpdateObject(id, data, currentUser.ID);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}
