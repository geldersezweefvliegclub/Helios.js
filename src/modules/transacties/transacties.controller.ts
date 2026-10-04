import {Body, Controller, HttpException, HttpStatus, Logger, Query} from '@nestjs/common';
import {TransactiesService} from "./transacties.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {CurrentUser} from "../login/current-user.decorator";
import {OperTransactie, Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperTransactiesResponse} from "./GetObjectsOperTransactiesResponse";
import {GetObjectsOperTransactiesRequest} from "./GetObjectsOperTransactiesRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {ApiTags} from "@nestjs/swagger";
import {CreateOperTransactieDto} from "../../generated/nestjs-dto/create-operTransactie.dto";
import {UpdateOperTransactieDto} from "../../generated/nestjs-dto/update-operTransactie.dto";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {parseDateOnly} from "../../core/helpers/TimeDate";
import {TransactieResponse} from "./TransactieResponse";

@Controller('Transacties')
@ApiTags('Transacties')
export class TransactiesController  extends HeliosController
{
   private readonly logger = new Logger(TransactiesController.name);

   constructor(private readonly TransactiesService: TransactiesService,
               private readonly permissieService:PermissieService)
   {
      super()
   }

   @HeliosGetObject(TransactieResponse)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<TransactieResponse>
   {
      this.logger.verbose(`TransactiesController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Transacties.GetObject');
      const obj = await this.TransactiesService.GetObject(id);
      this.heeftDataToegangGetObject(currentUser, obj);
      return this.TransactiesService.MaakTransactieResponse(obj);
   }

   @HeliosGetObjects(GetObjectsOperTransactiesResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperTransactiesRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperTransactiesResponse>>
   {
      this.logger.verbose(`TransactiesController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Transacties.GetObjects');
      this.heeftDataToegangGetObjects(currentUser);

      // zonder beheerder of beheerder DDWV rechten alleen de eigen transacties, zie GetObjects() in class.Transacties.inc.php
      const alleenLidId = this.heeftVolleToegang(currentUser) ? undefined : currentUser.ID;
      return await this.TransactiesService.GetObjects(queryParams, alleenLidId);
   }

   @HeliosCreateObject(CreateOperTransactieDto, TransactieResponse)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperTransactieDto): Promise<TransactieResponse>
   {
      this.logger.verbose(`TransactiesController.AddObject(${safeStringify({currentUser, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Transacties.AddObject');
      this.heeftDataToegangAddObject(currentUser);
      bodyHeeftData(data);

      const insert = await this.normaliserenData(currentUser, data, true) as Prisma.OperTransactieUncheckedCreateInput;
      const obj = await this.TransactiesService.AddObject(insert, currentUser.ID);
      return this.TransactiesService.MaakTransactieResponse(obj);
   }

   @HeliosUpdateObject(UpdateOperTransactieDto, TransactieResponse)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperTransactieDto): Promise<TransactieResponse>
   {
      this.logger.verbose(`TransactiesController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Transacties.UpdateObject');
      this.heeftDataToegangUpdateObject(currentUser);
      bodyHeeftData(data);
      id = id ?? data.ID;

      const update = await this.normaliserenData(currentUser, data, false) as Prisma.OperTransactieUncheckedUpdateInput;
      const obj = await this.TransactiesService.UpdateObject(id, update, currentUser.ID);
      return this.TransactiesService.MaakTransactieResponse(obj);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`TransactiesController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Transacties.DeleteObject');
      this.heeftDataToegangDeleteObject(currentUser);

      const data: Prisma.OperTransactieUncheckedUpdateInput = {
         VERWIJDERD: true
      }
      await this.TransactiesService.UpdateObject(id, data, currentUser.ID);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`TransactiesController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Transacties.RemoveObject');
      this.heeftDataToegangRemoveObject(currentUser);
      await this.TransactiesService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`TransactiesController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Transacties.RestoreObject');
      this.heeftDataToegangRestoreObject(currentUser);

      const data: Prisma.OperTransactieUncheckedUpdateInput = {
         VERWIJDERD: false
      }
      await this.TransactiesService.UpdateObject(id, data, currentUser.ID);
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden en normaliseert VLIEGDAG
   private async normaliserenData(
      currentUser: RefLid,
      data: CreateOperTransactieDto | UpdateOperTransactieDto,
      isNieuw: boolean): Promise<Prisma.OperTransactieUncheckedCreateInput | Prisma.OperTransactieUncheckedUpdateInput>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      // INGEVOERD_ID is altijd de ingelogde gebruiker bij nieuwe invoer, en kan daarna niet meer aangepast worden.
      // DATUM (tijdstip van aanmaken) en REFERENTIE (response van een extern systeem) worden niet door de client
      // gezet. Zie AddObject() en RequestToRecord() in class.Transacties.inc.php
      delete data.INGEVOERD_ID;
      if (isNieuw)
         data.INGEVOERD_ID = currentUser.ID;
      delete data.DATUM;
      delete data.REFERENTIE;

      // BETAALD en BETAAL_URL mogen alleen gezet worden door een Systeem account (bijv. Mollie/e-boekhouden
      // koppeling); voor alle andere gebruikers wordt een meegegeven waarde, net als bij VERWIJDERD, genegeerd
      if (!this.permissieService.isSysteemAccount(currentUser))
      {
         delete data.BETAALD;
         delete data.BETAAL_URL;
      }

      // zorg dat VLIEGDAG omgezet wordt in ISO 8601 formaat
      data.VLIEGDAG = parseDateOnly(data.VLIEGDAG as Date | string | null);

      return data as Prisma.OperTransactieUncheckedCreateInput | Prisma.OperTransactieUncheckedUpdateInput;
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

   // beheerder en beheerder DDWV hebben toegang tot alle transacties, zie class.Transacties.inc.php
   private heeftVolleToegang(currentUser: RefLid): boolean
   {
      return this.permissieService.isBeheerder(currentUser) || this.permissieService.isBeheerderDDWV(currentUser);
   }

   // controleer of de gebruiker toegang heeft tot de data van Transacties/GetObject
   // wordt aangeroepen nadat het record is opgehaald, zodat het niet twee keer uit de database gehaald wordt
   private heeftDataToegangGetObject(currentUser: RefLid, transactie: OperTransactie): void
   {
      // PHP controleert hier niets; net als bij GetObjects() mag een lid zonder beheerder rechten alleen de eigen
      // transacties zien
      if (!this.heeftVolleToegang(currentUser) && transactie.LID_ID !== currentUser.ID)
         throw new HttpException("Geen leesrechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Transacties/GetObjects
   private heeftDataToegangGetObjects(_currentUser: RefLid): void
   {
      // PHP geeft hier geen 401, de dataset wordt beperkt tot de eigen transacties (zie GetObjects() hierboven)
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Transacties/AddObject
   private heeftDataToegangAddObject(currentUser: RefLid): void
   {
      // alleen beheerder en beheerder DDWV - strenger dan PHP (AddObject() in class.Transacties.inc.php), waar een lid
      // ook een transactie voor zichzelf mocht aanmaken
      if (!this.heeftVolleToegang(currentUser))
         throw new HttpException("Geen rechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Transacties/UpdateObject
   private heeftDataToegangUpdateObject(currentUser: RefLid): void
   {
      // zie UpdateObject() in class.Transacties.inc.php
      if (!this.heeftVolleToegang(currentUser))
         throw new HttpException("Geen rechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Transacties/DeleteObject
   private heeftDataToegangDeleteObject(currentUser: RefLid): void
   {
      // zie VerwijderObject() in class.Transacties.inc.php
      if (!this.heeftVolleToegang(currentUser))
         throw new HttpException("Geen rechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Transacties/RemoveObject
   private heeftDataToegangRemoveObject(currentUser: RefLid): void
   {
      // bestaat niet in PHP; fysiek verwijderen van een financiële transactie alleen door de beheerder
      if (!this.permissieService.isBeheerder(currentUser))
         throw new HttpException("Geen rechten", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Transacties/RestoreObject
   private heeftDataToegangRestoreObject(currentUser: RefLid): void
   {
      // bestaat niet in PHP; zelfde rechten als DeleteObject
      if (!this.heeftVolleToegang(currentUser))
         throw new HttpException("Geen rechten", HttpStatus.UNAUTHORIZED);
   }
}
