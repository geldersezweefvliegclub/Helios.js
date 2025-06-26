import {Body, Controller, Query} from '@nestjs/common';
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


@Controller('Documenten')
@ApiTags('Documenten')
export class DocumentenController extends HeliosController
{
   constructor(private readonly documentenService: DocumentenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(HeliosDocumentDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<HeliosDocumentDto>
   {
      this.permissieService.heeftToegang(user, 'Documenten.GetObject');
      return await this.documentenService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsHeliosDocumentenResponse)
   GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsHeliosDocumentenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsHeliosDocumentenResponse>>
   {
      // check if the user has the right permissions
      this.permissieService.heeftToegang(user, 'Documenten.GetObjects');

      // retrieve the objects from the database based on the query parameters
      return this.documentenService.GetObjects (queryParams);
   }

   @HeliosCreateObject(CreateHeliosDocumentDto, HeliosDocumentDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateHeliosDocumentDto): Promise<HeliosDocumentDto>
   {
      this.permissieService.heeftToegang(user, 'Documenten.AddObject');

      // remove TYPE_ID from the data
      // and add them as connect to the insertData object
      const { LID_ID, GROEP_ID ,...insertData} = data;
      (insertData as Prisma.HeliosDocumentCreateInput).RefLid = (LID_ID !== undefined) ? { connect: {ID: LID_ID }} : undefined;
      (insertData as Prisma.HeliosDocumentCreateInput).DocumentGroep = (GROEP_ID !== undefined) ? { connect: {ID: GROEP_ID }} : undefined;

      return await this.documentenService.AddObject(insertData as Prisma.RefCompetentieCreateInput);
   }

   @HeliosUpdateObject(UpdateHeliosDocumentDto, HeliosDocumentDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateHeliosDocumentDto): Promise<HeliosDocument>
   {
      this.permissieService.heeftToegang(user, 'Documenten.UpdateObject');

      // remove TYPE_ID from the data
      // and add them as connect to the updateData object
      const { LID_ID, GROEP_ID, ...updateData} = data;
      (updateData as Prisma.HeliosDocumentUpdateInput).RefLid = LID_ID ? { connect: {ID: LID_ID }} : undefined;
      (updateData as Prisma.HeliosDocumentUpdateInput).DocumentGroep = GROEP_ID ? { connect: {ID: GROEP_ID }} : undefined;

      return await this.documentenService.UpdateObject(id, updateData as Prisma.HeliosDocumentUpdateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Documenten.DeleteObject');

      const data: Prisma.RefCompetentieUpdateInput = {
         VERWIJDERD: true
      }
      await this.documentenService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Documenten.RemoveObject');
      await this.documentenService.RemoveObject(id);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Documenten.RestoreObject');

      const data: Prisma.RefCompetentieUpdateInput = {
         VERWIJDERD: false
      }
      await this.documentenService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

}