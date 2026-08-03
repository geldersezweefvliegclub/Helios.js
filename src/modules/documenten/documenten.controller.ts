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
      this.permissieService.heeftToegang(currentUser, 'Documenten.AddObject');

      // verwijder TYPE_ID uit de data
      // en voeg ze toe als connect aan het insertData object
      const {LID_ID, GROEP_ID, ...rest} = data;
      const connect = (id?: number) => id !== undefined ? {connect: {ID: id}} : undefined;
      const insertData: Prisma.HeliosDocumentCreateInput = {
         ...rest,
         RefLid: connect(LID_ID),
         DocumentGroep: connect(GROEP_ID),
      };

      return await this.documentenService.AddObject(insertData);
   }

   @HeliosUpdateObject(UpdateHeliosDocumentDto, HeliosDocumentDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateHeliosDocumentDto): Promise<HeliosDocument>
   {
      this.logger.verbose(`DocumentenController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Documenten.UpdateObject');

      // verwijder TYPE_ID uit de data
      // en voeg ze toe als connect aan het updateData object
      const { LID_ID, GROEP_ID, ...updateData} = data;
      const connect = (id?: number) => id ? { connect: { ID: id } } : undefined;
      const update = updateData as Prisma.HeliosDocumentUpdateInput;
      update.RefLid = connect(LID_ID);
      update.DocumentGroep = connect(GROEP_ID);

      return await this.documentenService.UpdateObject(id, update);
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
      await this.documentenService.UpdateObject(id, data);
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
      await this.documentenService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

}