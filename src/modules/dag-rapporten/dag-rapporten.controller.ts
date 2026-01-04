import {Body, Controller, Query} from '@nestjs/common';
import {DagRapportenService} from "./dag-rapporten.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperDagRapportDto} from "../../generated/nestjs-dto/OperDagRapport.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperDagRapportenResponse} from "./GetObjectsOperDagRapportenResponse";
import {GetObjectsOperDagRapportenRequest} from "./GetObjectsOperDagRapportenRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperDagRapportDto} from "../../generated/nestjs-dto/create-OperDagRapport.dto";
import {UpdateOperDagRapportDto} from "../../generated/nestjs-dto/update-OperDagRapport.dto";
import {ApiTags} from "@nestjs/swagger";

@Controller('DagRapporten')
@ApiTags('DagRapporten')
export class DagRapportenController extends HeliosController
{
   constructor(private readonly DagRapportenService: DagRapportenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperDagRapportDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<OperDagRapportDto>
   {
      this.permissieService.heeftToegang(user, 'DagRapporten.GetObject');
      return await this.DagRapportenService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperDagRapportenResponse)
   GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsOperDagRapportenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperDagRapportenResponse>>
   {
      this.permissieService.heeftToegang(user, 'DagRapporten.GetObjects');
      return this.DagRapportenService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperDagRapportDto, OperDagRapportDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateOperDagRapportDto): Promise<OperDagRapportDto>
   {
      this.permissieService.heeftToegang(user, 'DagRapporten.AddObject');
      return await this.DagRapportenService.AddObject(data as Prisma.OperDagRapportCreateInput);
   }

   @HeliosUpdateObject(UpdateOperDagRapportDto, OperDagRapportDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperDagRapportDto): Promise<OperDagRapportDto>
   {
      this.permissieService.heeftToegang(user, 'DagRapporten.UpdateObject');
      return await this.DagRapportenService.UpdateObject(id, data as Prisma.OperDagRapportCreateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'DagRapporten.DeleteObject');

      const data: Prisma.OperDagRapportUpdateInput = {
         VERWIJDERD: true
      }
      await this.DagRapportenService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'DagRapporten.RemoveObject');
      await this.DagRapportenService.RemoveObject(id);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'DagRapporten.RestoreObject');

      const data: Prisma.OperDagRapportUpdateInput = {
         VERWIJDERD: false
      }
      await this.DagRapportenService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}
