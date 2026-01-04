import {Body, Controller, Query} from '@nestjs/common';
import {AanwezigVliegtuigenService} from "./aanwezig-vliegtuigen.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperAanwezigVliegtuigDto} from "../../generated/nestjs-dto/OperAanwezigVliegtuig.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperAanwezigVliegtuigenResponse} from "./GetObjectsOperAanwezigVliegtuigenResponse";
import {GetObjectsOperAanwezigVliegtuigenRequest} from "./GetObjectsOperAanwezigVliegtuigenRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperAanwezigVliegtuigDto} from "../../generated/nestjs-dto/create-OperAanwezigVliegtuig.dto";
import {UpdateOperAanwezigVliegtuigDto} from "../../generated/nestjs-dto/update-OperAanwezigVliegtuig.dto";
import {ApiTags} from "@nestjs/swagger";

@Controller('AanwezigVliegtuigen')
@ApiTags('AanwezigVliegtuigen')
export class AanwezigVliegtuigenController  extends HeliosController
{
   constructor(private readonly AanwezigVliegtuigenService: AanwezigVliegtuigenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperAanwezigVliegtuigDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<OperAanwezigVliegtuigDto>
   {
      this.permissieService.heeftToegang(user, 'AanwezigVliegtuigen.GetObject');
      return await this.AanwezigVliegtuigenService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperAanwezigVliegtuigenResponse)
   GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsOperAanwezigVliegtuigenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperAanwezigVliegtuigenResponse>>
   {
      this.permissieService.heeftToegang(user, 'AanwezigVliegtuigen.GetObjects');
      return this.AanwezigVliegtuigenService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperAanwezigVliegtuigDto, OperAanwezigVliegtuigDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateOperAanwezigVliegtuigDto): Promise<OperAanwezigVliegtuigDto>
   {
      this.permissieService.heeftToegang(user, 'AanwezigVliegtuigen.AddObject');
      return await this.AanwezigVliegtuigenService.AddObject(data as Prisma.OperAanwezigVliegtuigCreateInput);
   }

   @HeliosUpdateObject(UpdateOperAanwezigVliegtuigDto, OperAanwezigVliegtuigDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperAanwezigVliegtuigDto): Promise<OperAanwezigVliegtuigDto>
   {
      this.permissieService.heeftToegang(user, 'AanwezigVliegtuigen.UpdateObject');
      return await this.AanwezigVliegtuigenService.UpdateObject(id, data as Prisma.OperAanwezigVliegtuigCreateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'AanwezigVliegtuigen.DeleteObject');

      const data: Prisma.OperAanwezigVliegtuigUpdateInput = {
         VERWIJDERD: true
      }
      await this.AanwezigVliegtuigenService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'AanwezigVliegtuigen.RemoveObject');
      await this.AanwezigVliegtuigenService.RemoveObject(id);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'AanwezigVliegtuigen.RestoreObject');

      const data: Prisma.OperAanwezigVliegtuigUpdateInput = {
         VERWIJDERD: false
      }
      await this.AanwezigVliegtuigenService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}