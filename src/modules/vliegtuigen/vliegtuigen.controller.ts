import {Body, Controller, Query} from '@nestjs/common';
import {ApiTags} from "@nestjs/swagger";
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
import {Prisma, RefLid, RefVliegtuig} from "@prisma/client";
import {GetObjectsRefVliegtuigenResponse} from "./GetObjectsRefVliegtuigenResponse";
import {GetObjectsRefVliegtuigenRequest} from "./GetObjectsRefVliegtuigenRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {RefVliegtuigDto} from "../../generated/nestjs-dto/refVliegtuig.dto";
import {VliegtuigenService} from "./vliegtuigen.service";
import {CreateRefVliegtuigDto} from "../../generated/nestjs-dto/create-refVliegtuig.dto";
import {UpdateRefVliegtuigDto} from "../../generated/nestjs-dto/update-refVliegtuig.dto";

@Controller('Vliegtuigen')
@ApiTags('Vliegtuigen')
export class VliegtuigenController extends HeliosController
{
   constructor(private readonly vliegtuigenService: VliegtuigenService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(RefVliegtuigDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<RefVliegtuigDto>
   {
      this.permissieService.heeftToegang(user, 'Vliegtuigen.GetObject');
      return await this.vliegtuigenService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsRefVliegtuigenResponse)
   async GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsRefVliegtuigenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsRefVliegtuigenResponse>>
   {
      this.permissieService.heeftToegang(user, 'Vliegtuigen.GetObjects');
      return await this.vliegtuigenService.GetObjects (queryParams);
   }

   @HeliosCreateObject(CreateRefVliegtuigDto, RefVliegtuigDto)
   async AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateRefVliegtuigDto): Promise<RefVliegtuigDto>
   {
      this.permissieService.heeftToegang(user, 'Vliegtuigen.AddObject');

      // remove TYPE_ID from the data
      // and add them as connect to the insertData object
      const { TYPE_ID, ...insertData} = data;
      (insertData as Prisma.RefVliegtuigCreateInput).VliegtuigType = (TYPE_ID !== undefined) ? { connect: {ID: TYPE_ID }} : undefined;

      return await this.vliegtuigenService.AddObject(insertData as Prisma.RefVliegtuigCreateInput);
   }

   @HeliosUpdateObject(UpdateRefVliegtuigDto, RefVliegtuigDto)
   async UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateRefVliegtuigDto): Promise<RefVliegtuig>
   {
      this.permissieService.heeftToegang(user, 'Vliegtuigen.UpdateObject');

      // remove TYPE_ID from the data
      // and add them as connect to the updateData object
      const { TYPE_ID, ...updateData} = data;
      (updateData as Prisma.RefVliegtuigCreateInput).VliegtuigType = TYPE_ID ? { connect: {ID: TYPE_ID }} : undefined;

      return await this.vliegtuigenService.UpdateObject(id, updateData as Prisma.RefVliegtuigUpdateInput);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Vliegtuigen.DeleteObject');

      const data: Prisma.RefVliegtuigUpdateInput = {
         VERWIJDERD: true
      }
      await this.vliegtuigenService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Vliegtuigen.RemoveObject');
      await this.vliegtuigenService.RemoveObject(id);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Vliegtuigen.RestoreObject');

      const data: Prisma.RefVliegtuigUpdateInput = {
         VERWIJDERD: false
      }
      await this.vliegtuigenService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}
