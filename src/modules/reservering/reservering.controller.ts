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
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {parseDateOnly, toDateOnly} from "../../core/helpers/TimeDate";

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
      this.heeftDataToegangGetObject(currentUser);
      const obj = await this.reserveringService.GetObject(id);
      return {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
   }

   @HeliosGetObjects(GetObjectsOperReserveringResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperReserveringRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperReserveringResponse>>
   {
      this.logger.verbose(`ReserveringController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Reservering.GetObjects');
      this.heeftDataToegangGetObjects(currentUser);
      return await this.reserveringService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperReserveringDto, OperReserveringDto)
   @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Geen rechten om IS_GEBOEKT te zetten.'})
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperReserveringDto): Promise<OperReserveringDto>
   {
      this.logger.verbose(`ReserveringController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'Reservering.AddObject');
      this.heeftDataToegangAddObject(currentUser);

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

      const insert = await this.normaliserenData(data) as CreateOperReserveringDto;
      const obj = await this.reserveringService.AddObject(insert, currentUser);
      return {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
   }

   @HeliosUpdateObject(UpdateOperReserveringDto, OperReserveringDto)
   @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Geen rechten om IS_GEBOEKT te zetten.'})
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperReserveringDto): Promise<OperReserveringDto>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`ReserveringController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Reservering.UpdateObject');
      this.heeftDataToegangUpdateObject(currentUser);

      if ('INGEVOERD_ID' in data)
         throw new HttpException("INGEVOERD_ID kan niet extern gezet worden", HttpStatus.BAD_REQUEST);

      if (data.IS_GEBOEKT !== undefined && !this.permissieService.isBeheerder(currentUser) && !this.permissieService.isBeheerderDDWV(currentUser))
         throw new HttpException("Geen rechten om IS_GEBOEKT te zetten", HttpStatus.FORBIDDEN);

      const update = await this.normaliserenData(data) as UpdateOperReserveringDto;
      const obj = await this.reserveringService.UpdateObject(id, update, currentUser.ID);
      return {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`ReserveringController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Reservering.DeleteObject');
      await this.heeftDataToegangDeleteObject(currentUser, id);

      const data: Prisma.OperReserveringUncheckedUpdateInput = {
         VERWIJDERD: true
      }
      await this.reserveringService.UpdateObject(id, data, currentUser.ID);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`ReserveringController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Reservering.RemoveObject');
      this.heeftDataToegangRemoveObject(currentUser);
      await this.reserveringService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`ReserveringController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Reservering.RestoreObject');
      this.heeftDataToegangRestoreObject(currentUser);

      const data: Prisma.OperReserveringUncheckedUpdateInput = {
         VERWIJDERD: false
      }
      await this.reserveringService.UpdateObject(id, data, currentUser.ID);
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
      this.heeftDataToegangMagNogReserveren(currentUser);
      return await this.reserveringService.MagNogReserveren(currentUser.ID);
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden en normaliseert
   // de DATUM (enkel een kalenderdatum, geen tijd) naar een geldig Date object
   private async normaliserenData(
      data: CreateOperReserveringDto | UpdateOperReserveringDto): Promise<CreateOperReserveringDto | UpdateOperReserveringDto>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert
      // de DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      if (data.DATUM !== undefined)
         data.DATUM = parseDateOnly(data.DATUM as Date | string) as Date;

      return data;
   }

   // controleer of de gebruiker toegang heeft tot de data van Reservering/GetObject
   private heeftDataToegangGetObject(currentUser: RefLid): void
   {
      // alleen clubvliegers, starttoren of beheerder mogen reserveringen zien, zie GetObjects() in
      // class.Reservering.inc.php
      if (!this.permissieService.isClubVlieger(currentUser)
         && !this.permissieService.isStarttoren(currentUser)
         && !this.permissieService.isBeheerder(currentUser)
         && !this.permissieService.isInstructeur(currentUser)
         && !this.permissieService.isCIMT(currentUser))
         throw new HttpException("Geen leesrechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Reservering/GetObjects
   private heeftDataToegangGetObjects(currentUser: RefLid): void
   {
      // alleen clubvliegers, starttoren of beheerder mogen reserveringen zien, zie GetObjects() in
      // class.Reservering.inc.php
      if (!this.permissieService.isClubVlieger(currentUser)
         && !this.permissieService.isStarttoren(currentUser)
         && !this.permissieService.isBeheerder(currentUser)
         && !this.permissieService.isInstructeur(currentUser)
         && !this.permissieService.isCIMT(currentUser))
         throw new HttpException("Geen leesrechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Reservering/AddObject
   private heeftDataToegangAddObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Reservering/UpdateObject
   private heeftDataToegangUpdateObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Reservering/DeleteObject
   private async heeftDataToegangDeleteObject(currentUser: RefLid, id: number): Promise<void>
   {
      // verwijderen mag door de vlieger zelf, of door (DDWV) beheerder - zie VerwijderObject() in
      // class.Reservering.inc.php
      if (this.permissieService.isBeheerder(currentUser) || this.permissieService.isBeheerderDDWV(currentUser))
         return;

      const bestaand = await this.reserveringService.GetObject(id);
      if (!this.permissieService.ikBenHetZelf({ID: bestaand.LID_ID} as RefLid, currentUser))
         throw new HttpException("Geen schrijfrechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Reservering/RemoveObject
   private heeftDataToegangRemoveObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Reservering/RestoreObject
   private heeftDataToegangRestoreObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Reservering/MagNogReserveren
   private heeftDataToegangMagNogReserveren(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }
}
