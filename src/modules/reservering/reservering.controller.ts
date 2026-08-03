import {Body, Controller, Get, HttpException, HttpStatus, Logger, Query, UseGuards} from '@nestjs/common';
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
import {safeStringify} from "../../core/helpers/LogHelper";

@Controller('Reservering')
@ApiTags('Reservering')
export class ReserveringController extends HeliosController
{
   private readonly logger = new Logger(ReserveringController.name);

   constructor(private readonly reserveringService: ReserveringService,
               private readonly permissieService: PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperReserveringDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperReserveringDto>
   {
      this.logger.verbose(`ReserveringController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Reservering.GetObject');
      return await this.reserveringService.GetObject(id);
   }

   @HeliosGetObjects(GetObjectsOperReserveringResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperReserveringRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperReserveringResponse>>
   {
      this.logger.verbose(`ReserveringController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Reservering.GetObjects');
      return await this.reserveringService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperReserveringDto, OperReserveringDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperReserveringDto): Promise<OperReserveringDto>
   {
      this.logger.verbose(`ReserveringController.AddObject(${safeStringify({currentUser, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Reservering.AddObject');

      // INGEVOERD_ID wordt enkel intern gezet, zie RequestToRecord() in class.Reservering.inc.php
      if ('INGEVOERD_ID' in data)
         throw new HttpException("INGEVOERD_ID kan niet extern gezet worden", HttpStatus.BAD_REQUEST);

      // DATUM en VLIEGTUIG_ID zijn verplicht, zie AddObject() in class.Reservering.inc.php
      if (data.DATUM === undefined)
         throw new HttpException("Datum is verplicht", HttpStatus.BAD_REQUEST);
      if (data.VLIEGTUIG_ID === undefined)
         throw new HttpException("VliegtuigID is verplicht", HttpStatus.BAD_REQUEST);

      // IS_GEBOEKT mag alleen door een (DDWV) beheerder gezet worden
      if (data.IS_GEBOEKT !== undefined && !this.permissieService.isBeheerder(currentUser) && !this.permissieService.isBeheerderDDWV(currentUser))
         throw new HttpException("Geen rechten om IS_GEBOEKT te zetten", HttpStatus.FORBIDDEN);

      return await this.reserveringService.AddObject(data, currentUser);
   }

   @HeliosUpdateObject(UpdateOperReserveringDto, OperReserveringDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperReserveringDto): Promise<OperReserveringDto>
   {
      this.logger.verbose(`ReserveringController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Reservering.UpdateObject');

      if ('INGEVOERD_ID' in data)
         throw new HttpException("INGEVOERD_ID kan niet extern gezet worden", HttpStatus.BAD_REQUEST);

      if (data.IS_GEBOEKT !== undefined && !this.permissieService.isBeheerder(currentUser) && !this.permissieService.isBeheerderDDWV(currentUser))
         throw new HttpException("Geen rechten om IS_GEBOEKT te zetten", HttpStatus.FORBIDDEN);

      return await this.reserveringService.UpdateObject(id, data);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`ReserveringController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Reservering.DeleteObject');

      const data: Prisma.OperReserveringUpdateInput = {
         VERWIJDERD: true
      }
      await this.reserveringService.UpdateObject(id, data);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`ReserveringController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Reservering.RemoveObject');
      await this.reserveringService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`ReserveringController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Reservering.RestoreObject');

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
      @CurrentUser() currentUser: RefLid): Promise<boolean>
   {
      this.logger.verbose(`ReserveringController.MagNogReserveren(${safeStringify({currentUser})})`);
      this.permissieService.heeftToegang(currentUser, 'Reservering.MagNogReserveren');
      return await this.reserveringService.MagNogReserveren(currentUser.ID);
   }
}