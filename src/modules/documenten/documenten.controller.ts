import {Body, Controller, Logger, Query, Req} from '@nestjs/common';
import {Request} from "express";
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
import {CreateHeliosDocumentRequest} from "./CreateHeliosDocumentRequest";
import {UpdateHeliosDocumentRequest} from "./UpdateHeliosDocumentRequest";
import {ApiTags} from "@nestjs/swagger";
import {DocumentenService, DocumentUpload} from "./documenten.service";
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
      this.heeftDataToegangGetObject(currentUser);
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
      this.heeftDataToegangGetObjects(currentUser);

      // haal de objects op uit de database op basis van de query parameters
      return await this.documentenService.GetObjects (queryParams);
   }

   @HeliosCreateObject(CreateHeliosDocumentRequest, HeliosDocumentDto)
   async AddObject(
       @CurrentUser() currentUser: RefLid,
       @Req() request: Request,
       @Body() data: CreateHeliosDocumentRequest): Promise<HeliosDocumentDto> {
      this.logger.verbose(`DocumentenController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      // TODO: PHP vereist hier isBeheerder() || isCIMT() (401 anders) - heeftToegang() is nog een no-op stub
      this.permissieService.heeftToegang(currentUser, 'Documenten.AddObject');
      this.heeftDataToegangAddObject(currentUser);

      const upload = this.bepaalUpload(request, data);
      const insert = await this.normaliserenData(data) as Prisma.HeliosDocumentUncheckedCreateInput;
      return await this.documentenService.AddObject(insert, currentUser.ID, upload);
   }

   @HeliosUpdateObject(UpdateHeliosDocumentRequest, HeliosDocumentDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Req() request: Request,
      @Query('ID') id: number, @Body() data: UpdateHeliosDocumentRequest): Promise<HeliosDocument>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`DocumentenController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      // TODO: PHP vereist hier isBeheerder() || isCIMT() (401 anders) - heeftToegang() is nog een no-op stub
      this.permissieService.heeftToegang(currentUser, 'Documenten.UpdateObject');
      this.heeftDataToegangUpdateObject(currentUser);

      const upload = this.bepaalUpload(request, data);
      const update = await this.normaliserenData(data) as Prisma.HeliosDocumentUncheckedUpdateInput;
      return await this.documentenService.UpdateObject(id, update, currentUser.ID, upload);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DocumentenController.DeleteObject(${safeStringify({currentUser, id})})`);
      // TODO: PHP vereist hier isBeheerder() || isCIMT() (401 anders) - heeftToegang() is nog een no-op stub
      this.permissieService.heeftToegang(currentUser, 'Documenten.DeleteObject');
      this.heeftDataToegangDeleteObject(currentUser);

      const data: Prisma.HeliosDocumentUncheckedUpdateInput = {
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
      this.heeftDataToegangRemoveObject(currentUser);
      await this.documentenService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DocumentenController.RestoreObject(${safeStringify({currentUser, id})})`);
      // TODO: PHP vereist hier isBeheerder() || isCIMT() (401 anders) - heeftToegang() is nog een no-op stub
      this.permissieService.heeftToegang(currentUser, 'Documenten.RestoreObject');
      this.heeftDataToegangRestoreObject(currentUser);

      const data: Prisma.HeliosDocumentUncheckedUpdateInput = {
         VERWIJDERD: false
      }
      await this.documentenService.UpdateObject(id, data, currentUser.ID);
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden.
   // LID_ID en GROEP_ID hoeven niet omgezet te worden naar relatie-connects: met het Unchecked Prisma
   // inputtype zijn dit al platte kolommen, dus een meegegeven null zet de relatie direct los
   // (zowel bij create als update) zonder aparte afhandeling
   private async normaliserenData(
      data: CreateHeliosDocumentRequest | UpdateHeliosDocumentRequest): Promise<Prisma.HeliosDocumentUncheckedCreateInput | Prisma.HeliosDocumentUncheckedUpdateInput>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd. DOC_NAAM/BASE64_DOC/OVERSCHRIJVEN zijn geen kolommen van het
      // record - die zijn al door bepaalUpload() uitgelezen en worden hier alleen nog verwijderd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;
      delete data.DOC_NAAM;
      delete data.BASE64_DOC;
      delete data.OVERSCHRIJVEN;

      return data as Prisma.HeliosDocumentUncheckedCreateInput | Prisma.HeliosDocumentUncheckedUpdateInput;
   }

   // haalt de (niet-persistente) upload-velden uit de request en bouwt daarmee de publieke basis-URL op
   // basis van het binnenkomende request (schema + host), als vervanging voor het ontbrekende
   // app_settings.ServerName uit de PHP configuratie
   private bepaalUpload(request: Request, data: CreateHeliosDocumentRequest | UpdateHeliosDocumentRequest): DocumentUpload | undefined
   {
      if (!data.DOC_NAAM || !data.BASE64_DOC)
         return undefined;

      return {
         DOC_NAAM: data.DOC_NAAM,
         BASE64_DOC: data.BASE64_DOC,
         OVERSCHRIJVEN: data.OVERSCHRIJVEN,
         baseUrl: `${request.protocol}://${request.get('host')}`
      };
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

   // controleer of de gebruiker toegang heeft tot de data van Documenten/GetObject
   private heeftDataToegangGetObject(_currentUser: RefLid): void {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Documenten/GetObjects
   private heeftDataToegangGetObjects(_currentUser: RefLid): void {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Documenten/AddObject
   private heeftDataToegangAddObject(_currentUser: RefLid): void {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Documenten/UpdateObject
   private heeftDataToegangUpdateObject(_currentUser: RefLid): void {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Documenten/DeleteObject
   private heeftDataToegangDeleteObject(_currentUser: RefLid): void {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Documenten/RemoveObject
   private heeftDataToegangRemoveObject(_currentUser: RefLid): void {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Documenten/RestoreObject
   private heeftDataToegangRestoreObject(_currentUser: RefLid): void {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }
}
