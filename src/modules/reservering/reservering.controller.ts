import {Body, Controller, Get, HttpException, HttpStatus, Query, UseGuards} from '@nestjs/common';
import {ReserveringService} from "./reservering.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperReserveringDto} from "../../generated/nestjs-dto/operReservering.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperReserveringResponse} from "./GetObjectsOperReserveringResponse";
import {GetObjectsOperReserveringRequest} from "./GetObjectsOperReserveringRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperReserveringDto} from "../../generated/nestjs-dto/create-operReservering.dto";
import {UpdateOperReserveringDto} from "../../generated/nestjs-dto/update-operReservering.dto";
import {ApiBasicAuth, ApiOperation, ApiResponse, ApiTags} from "@nestjs/swagger";
import {AuthGuard} from "@nestjs/passport";

@Controller('Reservering')
@ApiTags('Reservering')
export class ReserveringController extends HeliosController
{
   constructor(private readonly reserveringService: ReserveringService,
               private readonly permissieService: PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperReserveringDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<OperReserveringDto>
   {
      this.permissieService.heeftToegang(user, 'Reservering.GetObject');
      return await this.reserveringService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperReserveringResponse)
   GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsOperReserveringRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperReserveringResponse>>
   {
      this.permissieService.heeftToegang(user, 'Reservering.GetObjects');
      return this.reserveringService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperReserveringDto, OperReserveringDto)
   AddObject(
      @CurrentUser() user: RefLid,
      @Body() data: CreateOperReserveringDto): Promise<OperReserveringDto>
   {
      this.permissieService.heeftToegang(user, 'Reservering.AddObject');

      // INGEVOERD_ID wordt enkel intern gezet, zie RequestToRecord() in class.Reservering.inc.php
      if ('INGEVOERD_ID' in data)
         throw new HttpException("INGEVOERD_ID kan niet extern gezet worden", HttpStatus.BAD_REQUEST);

      // DATUM en VLIEGTUIG_ID zijn verplicht, zie AddObject() in class.Reservering.inc.php
      if (data.DATUM === undefined)
         throw new HttpException("Datum is verplicht", HttpStatus.BAD_REQUEST);
      if (data.VLIEGTUIG_ID === undefined)
         throw new HttpException("VliegtuigID is verplicht", HttpStatus.BAD_REQUEST);

      // IS_GEBOEKT mag alleen door een (DDWV) beheerder gezet worden
      if (data.IS_GEBOEKT !== undefined && !this.permissieService.isBeheerder(user) && !this.permissieService.isBeheerderDDWV(user))
         throw new HttpException("Geen rechten om IS_GEBOEKT te zetten", HttpStatus.FORBIDDEN);

      return this.reserveringService.AddObject(data, user);
   }

   @HeliosUpdateObject(UpdateOperReserveringDto, OperReserveringDto)
   UpdateObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperReserveringDto): Promise<OperReserveringDto>
   {
      this.permissieService.heeftToegang(user, 'Reservering.UpdateObject');

      if ('INGEVOERD_ID' in data)
         throw new HttpException("INGEVOERD_ID kan niet extern gezet worden", HttpStatus.BAD_REQUEST);

      if (data.IS_GEBOEKT !== undefined && !this.permissieService.isBeheerder(user) && !this.permissieService.isBeheerderDDWV(user))
         throw new HttpException("Geen rechten om IS_GEBOEKT te zetten", HttpStatus.FORBIDDEN);

      return this.reserveringService.UpdateObject(id, data);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Reservering.DeleteObject');

      const data: Prisma.OperReserveringUpdateInput = {
         VERWIJDERD: true
      }
      await this.reserveringService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Reservering.RemoveObject');
      await this.reserveringService.RemoveObject(id);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() user: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.permissieService.heeftToegang(user, 'Reservering.RestoreObject');

      const data: Prisma.OperReserveringUpdateInput = {
         VERWIJDERD: false
      }
      await this.reserveringService.UpdateObject(id, data);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

   @Get("MagNogReserveren")
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiOperation({summary: 'Controleert of de ingelogde gebruiker dit jaar nog een vliegtuig mag reserveren.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({status: HttpStatus.OK, description: 'True als de gebruiker nog mag reserveren.', schema: {type: 'boolean'}})
   async MagNogReserveren(
      @CurrentUser() user: RefLid): Promise<boolean>
   {
      this.permissieService.heeftToegang(user, 'Reservering.MagNogReserveren');
      return this.reserveringService.MagNogReserveren(user.ID);
   }
}