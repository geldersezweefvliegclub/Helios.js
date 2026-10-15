import {Body, Controller, HttpException, HttpStatus, Logger, Query} from '@nestjs/common';
import {RoosterService} from "./rooster.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperRoosterDto} from "../../generated/nestjs-dto/operRooster.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperRoosterResponse} from "./GetObjectsOperRoosterResponse";
import {GetObjectsOperRoosterRequest} from "./GetObjectsOperRoosterRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperRoosterDto} from "../../generated/nestjs-dto/create-operRooster.dto";
import {UpdateOperRoosterDto} from "../../generated/nestjs-dto/update-operRooster.dto";
import {ApiTags} from "@nestjs/swagger";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {parseDateOnly, toDateOnly} from "../../core/helpers/TimeDate";

@Controller('Rooster')
@ApiTags('Rooster')
export class RoosterController  extends HeliosController
{
   private readonly logger = new Logger(RoosterController.name);

   constructor(private readonly RoosterService: RoosterService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(OperRoosterDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperRoosterDto>
   {
      this.logger.verbose(`RoosterController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Rooster.GetObject');
      this.heeftDataToegangGetObject(currentUser);
      const obj = await this.RoosterService.GetObject(id);
      return {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
   }

   @HeliosGetObjects(GetObjectsOperRoosterResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperRoosterRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperRoosterResponse>>
   {
      this.logger.verbose(`RoosterController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Rooster.GetObjects');
      this.heeftDataToegangGetObjects(currentUser);
      return await this.RoosterService.GetObjects(queryParams);
   }

   @HeliosCreateObject(CreateOperRoosterDto, OperRoosterDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperRoosterDto): Promise<OperRoosterDto>
   {
      this.logger.verbose(`RoosterController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'Rooster.AddObject');
      this.heeftDataToegangAddObject(currentUser);

      // een gewone gebruiker mag alleen een default rooster aanmaken: OPMERKINGEN leeg, DDWV, CLUB_BEDRIJF en
      // WINTER_WERK worden door de service afgeleid van de datum, zie AddObject()
      if (!this.magVeldenInvullen(currentUser))
      {
         data.OPMERKINGEN = null;
         delete data.DDWV;
         delete data.CLUB_BEDRIJF;
         delete data.WINTER_WERK;
      }

      const insert = await this.normaliserenData(data) as CreateOperRoosterDto;
      const obj = await this.RoosterService.AddObject(insert as Prisma.OperRoosterUncheckedCreateInput, currentUser.ID);
      return {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
   }

   @HeliosUpdateObject(UpdateOperRoosterDto, OperRoosterDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperRoosterDto): Promise<OperRoosterDto>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`RoosterController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Rooster.UpdateObject');
      this.heeftDataToegangUpdateObject(currentUser);

      const update = await this.normaliserenData(data) as UpdateOperRoosterDto;
      const obj = await this.RoosterService.UpdateObject(id, update as Prisma.OperRoosterUncheckedUpdateInput, currentUser.ID);
      return {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`RoosterController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Rooster.DeleteObject');
      this.heeftDataToegangDeleteObject(currentUser);

      const data: Prisma.OperRoosterUncheckedUpdateInput = {
         VERWIJDERD: true
      }
      await this.RoosterService.UpdateObject(id, data, currentUser.ID);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`RoosterController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Rooster.RemoveObject');
      this.heeftDataToegangRemoveObject(currentUser);
      await this.RoosterService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`RoosterController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Rooster.RestoreObject');
      this.heeftDataToegangRestoreObject(currentUser);

      const data: Prisma.OperRoosterUncheckedUpdateInput = {
         VERWIJDERD: false
      }
      await this.RoosterService.UpdateObject(id, data, currentUser.ID);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden en normaliseert
   // de DATUM (enkel een kalenderdatum, geen tijd) naar een geldig Date object
   private async normaliserenData(
      data: CreateOperRoosterDto | UpdateOperRoosterDto): Promise<CreateOperRoosterDto | UpdateOperRoosterDto>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert
      // de DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      // DATUM is optioneel op de update-DTO maar verplicht op de create-DTO: cast om deze union-brede
      // toewijzing toe te staan
      (data as Pick<CreateOperRoosterDto, "DATUM">).DATUM = parseDateOnly(data.DATUM as Date | string) as Date;

      return data;
   }

   // beheerders en roostermaker mogen OPMERKINGEN, DDWV, CLUB_BEDRIJF en WINTER_WERK zelf invullen,
   private magVeldenInvullen(currentUser: RefLid): boolean
   {
      return this.permissieService.isBeheerder(currentUser)
         || this.permissieService.isBeheerderDDWV(currentUser)
         || this.permissieService.isRooster(currentUser);
   }

   // controleer of de gebruiker toegang heeft tot de data van Rooster/GetObject
   private heeftDataToegangGetObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Rooster/GetObjects
   private heeftDataToegangGetObjects(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Rooster/AddObject
   private heeftDataToegangAddObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Rooster/UpdateObject
   private heeftDataToegangUpdateObject(currentUser: RefLid): void
   {
      if (!this.permissieService.isBeheerder(currentUser)
         && !this.permissieService.isBeheerderDDWV(currentUser)
         && !this.permissieService.isRooster(currentUser)
         && !this.permissieService.isCIMT(currentUser))
         throw new HttpException("Geen schrijfrechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Rooster/DeleteObject
   private heeftDataToegangDeleteObject(currentUser: RefLid): void
   {
      if (!this.permissieService.isBeheerder(currentUser)
         && !this.permissieService.isBeheerderDDWV(currentUser)
         && !this.permissieService.isRooster(currentUser))
         throw new HttpException("Geen schrijfrechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Rooster/RemoveObject
   private heeftDataToegangRemoveObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Rooster/RestoreObject
   private heeftDataToegangRestoreObject(currentUser: RefLid): void
   {
      if (!this.permissieService.isBeheerder(currentUser)
         && !this.permissieService.isBeheerderDDWV(currentUser)
         && !this.permissieService.isRooster(currentUser))
         throw new HttpException("Geen schrijfrechten", HttpStatus.UNAUTHORIZED);
   }
}
