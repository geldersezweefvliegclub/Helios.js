import {Body, Controller, Get, HttpException, HttpStatus, Logger, Query, UseGuards} from '@nestjs/common';
import {AuthGuard} from "@nestjs/passport";
import {DienstenService} from "./diensten.service";
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
import {Prisma, RefLid} from "@prisma/client";
import {GetOperDienstenResponse} from "./GetOperDienstenResponse";
import {GetObjectsOperDienstenRequest} from "./GetObjectsOperDienstenRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperDienstDto} from "../../generated/nestjs-dto/create-operDienst.dto";
import {UpdateOperDienstDto} from "../../generated/nestjs-dto/update-operDienst.dto";
import {ApiBasicAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags, getSchemaPath} from "@nestjs/swagger";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {parseDateOnly} from "../../core/helpers/TimeDate";
import {RoosterService} from "../rooster/rooster.service";
import {GetObjectsOperRoosterRequest} from "../rooster/GetObjectsOperRoosterRequest";
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";
import {TotaalDienstenRequest} from "./TotaalDienstenRequest";
import {TotaalDienstenResponse} from "./TotaalDienstenResponse";

@Controller('Diensten')
@ApiTags('Diensten')
export class DienstenController  extends HeliosController
{
   private readonly logger = new Logger(DienstenController.name);

   constructor(private readonly DienstenService: DienstenService,
               private readonly permissieService:PermissieService,
               private readonly roosterService: RoosterService)
   {
      super()
   }

   @HeliosGetObject(GetOperDienstenResponse)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<GetOperDienstenResponse>
   {
      this.logger.verbose(`DienstenController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Diensten.GetObject');
      this.heeftDataToegangGetObject(currentUser);
      const dienst = await this.DienstenService.GetObject(id);
      return this.maskeerUitbetaaldVoorGebruiker(dienst, currentUser);
   }

   @HeliosGetObjects(GetOperDienstenResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperDienstenRequest): Promise<IHeliosGetObjectsResponse<GetOperDienstenResponse>>
   {
      this.logger.verbose(`DienstenController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Diensten.GetObjects');
      this.heeftDataToegangGetObjects(currentUser);

      const toegestaneDatums = await this.bepaalToegestaneDatums(currentUser, queryParams);
      const result = await this.DienstenService.GetObjects(queryParams, toegestaneDatums);
      result.dataset = result.dataset.map(dienst => this.maskeerUitbetaaldVoorGebruiker(dienst, currentUser));
      return result;
   }

   @HeliosCreateObject(CreateOperDienstDto, GetOperDienstenResponse)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperDienstDto): Promise<GetOperDienstenResponse>
   {
      this.logger.verbose(`DienstenController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'Diensten.AddObject');
      this.heeftDataToegangAddObject(currentUser);

      // DDWV-leden (LIDTYPE_ID = DDWV) mogen zelf nooit een dienst aanmaken
      if (this.permissieService.isDDWVer(currentUser)) {
         throw new HttpException("Geen schrijfrechten DDWV", HttpStatus.UNAUTHORIZED);
      }

      const insert = await this.normaliserenData(data) as Prisma.OperDienstUncheckedCreateInput;
      // als LID_ID niet is meegegeven, wordt de ingelogde gebruiker zelf ingeroosterd
      insert.LID_ID ??= currentUser.ID;

      // Een dienst toewijzen aan een ANDER lid dan jezelf mag enkel door BeheerderDDWV of Rooster
      // voor iedereen anders geldt de generieke schrijf-toegangscheck
      if (insert.LID_ID !== currentUser.ID &&
          !this.permissieService.isBeheerderDDWV(currentUser) &&
          !this.permissieService.isRooster(currentUser))
      {
         this.permissieService.heeftToegang(currentUser, 'Diensten.AddObject.AndersLid');
      }

      // INGEVOERD_DOOR_ID wordt altijd server-side gezet op de ingelogde gebruiker, nooit overgenomen
      // uit de aanvraag (@DtoReadOnly in het Prisma schema zorgt dat de DTO dit veld al niet accepteert)
      insert.INGEVOERD_DOOR_ID = currentUser.ID;
      return await this.DienstenService.AddObject(insert, currentUser.ID);
   }

   @HeliosUpdateObject(UpdateOperDienstDto, GetOperDienstenResponse)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperDienstDto): Promise<GetOperDienstenResponse>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`DienstenController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'Diensten.UpdateObject');
      this.heeftDataToegangUpdateObject(currentUser);

      const bestaandeDienst = await this.DienstenService.GetObject(id);
      this.controleerSchrijfrechten(bestaandeDienst, currentUser);

      const update = await this.normaliserenData(data) as Prisma.OperDienstUncheckedUpdateInput;
      // INGEVOERD_DOOR_ID wordt bij elke wijziging opnieuw op de ingelogde gebruiker gezet
      // registreert wie de dienst het laatst heeft aangepast, niet enkel wie hem heeft aangemaakt
      update.INGEVOERD_DOOR_ID = currentUser.ID;
      return await this.DienstenService.UpdateObject(id, update, currentUser.ID);
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DienstenController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Diensten.DeleteObject');
      this.heeftDataToegangDeleteObject(currentUser);

      const bestaandeDienst = await this.DienstenService.GetObject(id);
      this.controleerSchrijfrechten(bestaandeDienst, currentUser);

      const data: Prisma.OperDienstUncheckedUpdateInput = {
         VERWIJDERD: true
      }
      await this.DienstenService.UpdateObject(id, data, currentUser.ID);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DienstenController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Diensten.RemoveObject');
      this.heeftDataToegangRemoveObject(currentUser);
      await this.DienstenService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DienstenController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'Diensten.RestoreObject');
      this.heeftDataToegangRestoreObject(currentUser);

      const data: Prisma.OperDienstUncheckedUpdateInput = {
         VERWIJDERD: false
      }
      await this.DienstenService.UpdateObject(id, data, currentUser.ID);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

   @Get('TotaalDiensten')
   @ApiBasicAuth()
   @UseGuards(AuthGuard(['jwt', 'basic-auth']))
   @ApiExtraModels(TotaalDienstenResponse)
   @ApiOperation({summary: 'Aantal diensten per lid per maand in een bepaald jaar, enkel voor club-bedrijf dagen.'})
   @ApiResponse({status: HttpStatus.BAD_REQUEST, description: 'Verkeerde input data.'})
   @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Geen toegang.'})
   @ApiResponse({status: HttpStatus.OK, description: 'Telling opgehaald.', schema: {
         type: 'array',
         items: {$ref: getSchemaPath(TotaalDienstenResponse)}
      }})
   async TotaalDiensten(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: TotaalDienstenRequest): Promise<TotaalDienstenResponse[]>
   {
      this.logger.verbose(`DienstenController.TotaalDiensten(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'Diensten.TotaalDiensten');
      this.heeftDataToegangTotaalDiensten(currentUser);
      return await this.DienstenService.TotaalDiensten(queryParams.JAAR, queryParams.LID_ID);
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden en
   // normaliseert het datumveld
   private async normaliserenData(
      data: CreateOperDienstDto | UpdateOperDienstDto): Promise<Prisma.OperDienstUncheckedCreateInput | Prisma.OperDienstUncheckedUpdateInput>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      // zorg dat de datum omgezet wordt in ISO 8601 formaat
      data.DATUM = parseDateOnly(data.DATUM as Date | string) as Date;

      return data as Prisma.OperDienstUncheckedCreateInput | Prisma.OperDienstUncheckedUpdateInput;
   }

   // DDWV'ers (LIDTYPE_ID = DDWV) mogen enkel diensten zien op DDWV-dagen (oper_rooster.DDWV = 1)
   // binnen het opgevraagde datumbereik; andere gebruikers zien alles
   private async bepaalToegestaneDatums(
      currentUser: RefLid, queryParams: GetObjectsOperDienstenRequest): Promise<Date[] | undefined>
   {
      if (!this.permissieService.isDDWVer(currentUser))
         return undefined;

      const dtSpanne = queryParams.VanTot(queryParams.DATUM, queryParams.BEGIN_DATUM, queryParams.EIND_DATUM);

      const roosterResult = await this.roosterService.GetObjects(
         MaakGetObjectsRequest(GetObjectsOperRoosterRequest, {BEGIN_DATUM: dtSpanne.start, EIND_DATUM: dtSpanne.eind})
      );

      return roosterResult.dataset
         .filter(rooster => rooster.DDWV)
         .map(rooster => new Date(rooster.DATUM));
   }

   // PHP class.Diensten.inc.php::GetObject()/GetObjects() - UITBETAALD mag enkel gezien worden door
   // Beheerder/BeheerderDDWV; voor andere gebruikers wordt het veld volledig weggelaten uit de response
   // (net als PHP's unset($obj['UITBETAALD']))
   private maskeerUitbetaaldVoorGebruiker(dienst: GetOperDienstenResponse, currentUser: RefLid): GetOperDienstenResponse
   {
      if (this.permissieService.isBeheerder(currentUser) || this.permissieService.isBeheerderDDWV(currentUser))
         return dienst;

      dienst.UITBETAALD = undefined as unknown as boolean;
      return dienst;
   }

   // PHP class.Diensten.inc.php::magVerwijderenAanpassen() - wie mag een dienst aanpassen of verwijderen?
   // DDWV'ers (LIDTYPE_ID = DDWV) mogen dit nooit. Beheerder/BeheerderDDWV/Rooster mogen altijd. Iedereen
   // anders mag enkel zijn/haar EIGEN dienst aanpassen, en dat alleen binnen 4 uur na de laatste aanpassing
   // wanneer de dienst-datum binnen 60 dagen (verleden of toekomst) ligt - verder weg gelegen diensten zijn
   // altijd vrij aan te passen. (De PHP-implementatie gebruikt hiervoor een ondertekend dagverschil dat voor
   // oude, ver-in-het-verleden liggende diensten altijd "binnen 60 dagen" oplevert - hier bewust met de
   // absolute waarde van het verschil geïmplementeerd, zoals de intentie van de code duidelijk is.)
   private controleerSchrijfrechten(dienst: GetOperDienstenResponse, currentUser: RefLid): void
   {
      if (this.permissieService.isDDWVer(currentUser)) {
         throw new HttpException("Geen schrijfrechten DDWV", HttpStatus.UNAUTHORIZED);
      }

      if (this.permissieService.isBeheerder(currentUser) ||
          this.permissieService.isBeheerderDDWV(currentUser) ||
          this.permissieService.isRooster(currentUser))
      {
         return;
      }

      if (dienst.LID_ID !== currentUser.ID) {
         throw new HttpException("Geen schrijfrechten", HttpStatus.UNAUTHORIZED);
      }

      const eenDagInMs = 24 * 60 * 60 * 1000;
      const dagenVerschil = Math.abs(Date.now() - new Date(dienst.DATUM).getTime()) / eenDagInMs;

      if (dagenVerschil < 60) {
         const urenVerschil = Math.abs(Date.now() - new Date(dienst.LAATSTE_AANPASSING).getTime()) / (60 * 60 * 1000);
         if (urenVerschil > 4) {
            throw new HttpException("Geen schrijfrechten (bewerktermijn van 4 uur verstreken)", HttpStatus.UNAUTHORIZED);
         }
      }
   }

   // controleer of de gebruiker toegang heeft tot de data van Diensten/GetObject
   private heeftDataToegangGetObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Diensten/GetObjects
   private heeftDataToegangGetObjects(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Diensten/AddObject
   private heeftDataToegangAddObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Diensten/UpdateObject
   private heeftDataToegangUpdateObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Diensten/DeleteObject
   private heeftDataToegangDeleteObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Diensten/RemoveObject
   private heeftDataToegangRemoveObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Diensten/RestoreObject
   private heeftDataToegangRestoreObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van Diensten/TotaalDiensten
   private heeftDataToegangTotaalDiensten(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }
}
