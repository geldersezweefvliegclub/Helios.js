import {Body, Controller, Logger, Query} from '@nestjs/common';
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject, HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {PermissieService} from "../authorisatie/permissie.service";
import {CurrentUser} from "../login/current-user.decorator";
import {HeliosDocument, Prisma, RefLid} from "@prisma/client";
import {GetObjectsHeliosDocumentenResponse} from "./GetObjectsHeliosDocumentenResponse";
import {GetObjectsHeliosDocumentenRequest} from "./GetObjectsHeliosDocumentenRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {HeliosDocumentDto} from "../../generated/nestjs-dto/heliosDocument.dto";
import {CreateHeliosDocumentDto} from "../../generated/nestjs-dto/create-heliosDocument.dto";
import {UpdateHeliosDocumentDto} from "../../generated/nestjs-dto/update-heliosDocument.dto";
import {ApiTags} from "@nestjs/swagger";
import {DocumentenService} from "./documenten.service";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";


@Controller('Documenten')
@ApiTags('Documenten')
export class DocumentenController extends HeliosController
{
   private readonly logger = new Logger(DocumentenController.name);

   constructor(private readonly documentenService: DocumentenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(HeliosDocumentDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<HeliosDocumentDto>
   {
      this.logger.verbose(`DocumentenController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Documenten.GetObject');
      return await this.documentenService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsHeliosDocumentenResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsHeliosDocumentenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsHeliosDocumentenResponse>>
   {
      this.logger.verbose(`DocumentenController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      // controleer of de gebruiker de juiste rechten heeft
      this.permissieService.heeftToegang(currentUser, 'Documenten.GetObjects');

      // haal de objects op uit de database op basis van de query parameters
      return await this.documentenService.GetObjects (queryParams);
   }

   @HeliosCreateObject(CreateHeliosDocumentDto, HeliosDocumentDto)
   async AddObject(
       @CurrentUser() currentUser: RefLid,
       @Body() data: CreateHeliosDocumentDto): Promise<HeliosDocumentDto> {
      this.logger.verbose(`DocumentenController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'Documenten.AddObject');

      const insert = await this.normaliserenData(data) as Prisma.HeliosDocumentCreateInput;
      return await this.documentenService.AddObject(insert, currentUser.ID);
   }

   @HeliosUpdateObject(UpdateHeliosDocumentDto, HeliosDocumentDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateHeliosDocumentDto): Promise<HeliosDocument>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`DocumentenController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Documenten.UpdateObject');

      const update = await this.normaliserenData(data) as Prisma.HeliosDocumentUpdateInput;
      return await this.documentenService.UpdateObject(id, update, currentUser.ID);
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden en zet de
   // *_ID velden om naar relatie-connects
   private async normaliserenData(
      data: CreateHeliosDocumentDto | UpdateHeliosDocumentDto): Promise<Prisma.HeliosDocumentCreateInput | Prisma.HeliosDocumentUpdateInput>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      // verwijder LID_ID, GROEP_ID uit de data
      // en voeg ze toe als connect aan het insert-/updateData object
      const { LID_ID, GROEP_ID, ...rest } = data;
      const result = rest as Prisma.HeliosDocumentCreateInput | Prisma.HeliosDocumentUpdateInput;
      const connect = (id?: number) => id !== undefined ? { connect: { ID: id } } : undefined;
      result.RefLid = connect(LID_ID);
      result.DocumentGroep = connect(GROEP_ID);

      return result;
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DocumentenController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Documenten.DeleteObject');

      const data: Prisma.RefCompetentieUpdateInput = {
         VERWIJDERD: true
      }
      await this.documentenService.UpdateObject(id, data, currentUser.ID);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DocumentenController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Documenten.RemoveObject');
      await this.documentenService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DocumentenController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Documenten.RestoreObject');

      const data: Prisma.RefCompetentieUpdateInput = {
         VERWIJDERD: false
      }
      await this.documentenService.UpdateObject(id, data, currentUser.ID);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

}