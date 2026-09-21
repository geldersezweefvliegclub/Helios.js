import {Body, Controller, HttpException, HttpStatus, Logger, Query} from '@nestjs/common';
import {DagRapportenService} from "./dag-rapporten.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {RoosterService} from "../rooster/rooster.service";
import {DienstenService} from "../diensten/diensten.service";
import {GetObjectsOperRoosterRequest} from "../rooster/GetObjectsOperRoosterRequest";
import {GetObjectsOperDienstenRequest} from "../diensten/GetObjectsOperDienstenRequest";
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperDagRapportDto} from "../../generated/nestjs-dto/operDagRapport.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperDagRapportenResponse} from "./GetObjectsOperDagRapportenResponse";
import {GetObjectsOperDagRapportenRequest} from "./GetObjectsOperDagRapportenRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperDagRapportDto} from "../../generated/nestjs-dto/create-operDagRapport.dto";
import {UpdateOperDagRapportDto} from "../../generated/nestjs-dto/update-operDagRapport.dto";
import {ApiTags} from "@nestjs/swagger";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {parseDateOnly, toDateOnly} from "../../core/helpers/TimeDate";

@Controller('DagRapporten')
@ApiTags('DagRapporten')
export class DagRapportenController extends HeliosController
{
   private readonly logger = new Logger(DagRapportenController.name);

   constructor(private readonly DagRapportenService: DagRapportenService,
               private readonly permissieService:PermissieService,
               private readonly roosterService: RoosterService,
               private readonly dienstenService: DienstenService)
   {
      super()
   }

   @HeliosGetObject(OperDagRapportDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<OperDagRapportDto>
   {
      this.logger.verbose(`DagRapportenController.GetObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'DagRapporten.GetObject');
      const obj = await this.DagRapportenService.GetObject(id);
      return {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
   }

   @HeliosGetObjects(GetObjectsOperDagRapportenResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperDagRapportenRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperDagRapportenResponse>>
   {
      this.logger.verbose(`DagRapportenController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'DagRapporten.GetObjects');

      const toegestaneDatums = await this.bepaalToegestaneDatums(currentUser, queryParams);
      return await this.DagRapportenService.GetObjects(queryParams, toegestaneDatums);
   }

   @HeliosCreateObject(CreateOperDagRapportDto, OperDagRapportDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperDagRapportDto): Promise<OperDagRapportDto>
   {
      this.logger.verbose(`DagRapportenController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'DagRapporten.AddObject');

      const insert = await this.normaliserenData(data) as Prisma.OperDagRapportUncheckedCreateInput;
      // PHP class.DagRapporten.inc.php::AddObject() - INGEVOERD_ID wordt altijd server-side gezet op de
      // ingelogde gebruiker, nooit overgenomen uit de aanvraag, en blijft na aanmaken onveranderlijk
      insert.INGEVOERD_ID = currentUser.ID;
      const obj = await this.DagRapportenService.AddObject(insert, currentUser.ID);
      return {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
   }

   @HeliosUpdateObject(UpdateOperDagRapportDto, OperDagRapportDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperDagRapportDto): Promise<OperDagRapportDto>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`DagRapportenController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'DagRapporten.UpdateObject');

      const update = await this.normaliserenData(data) as Prisma.OperDagRapportUncheckedUpdateInput;
      const obj = await this.DagRapportenService.UpdateObject(id, update, currentUser.ID);
      return {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DagRapportenController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'DagRapporten.DeleteObject');

      const data: Prisma.OperDagRapportUncheckedUpdateInput = {
         VERWIJDERD: true
      }
      await this.DagRapportenService.UpdateObject(id, data, currentUser.ID);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DagRapportenController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'DagRapporten.RemoveObject');
      await this.DagRapportenService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DagRapportenController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'DagRapporten.RestoreObject');

      const data: Prisma.OperDagRapportUncheckedUpdateInput = {
         VERWIJDERD: false
      }
      await this.DagRapportenService.UpdateObject(id, data, currentUser.ID);
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden en
   // normaliseert het datumveld
   private async normaliserenData(
      data: CreateOperDagRapportDto | UpdateOperDagRapportDto): Promise<Prisma.OperDagRapportUncheckedCreateInput | Prisma.OperDagRapportUncheckedUpdateInput>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert
      // de DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd. INGEVOERD_ID is @DtoReadOnly in het Prisma schema en zit daarom
      // al helemaal niet in Create/UpdateOperDagRapportDto - het wordt enkel bij het aanmaken server-side
      // gezet (zie AddObject) en blijft daarna onveranderlijk.
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      // zorg dat de datum omgezet wordt in ISO 8601 formaat
      data.DATUM = parseDateOnly(data.DATUM as Date | string) as Date;

      return data as Prisma.OperDagRapportUncheckedCreateInput | Prisma.OperDagRapportUncheckedUpdateInput;
   }

   // PHP class.DagRapporten.inc.php::GetObjects() - Beheerder/Instructeur/CIMT mogen alle dagrapporten
   // zien (undefined = geen beperking); DDWV-Beheerder/DDWV-Crew mogen enkel DDWV-dagen zien binnen het
   // opgevraagde datumbereik, Crew bovendien enkel de dagen waarop ze zelf dienst hadden; alle andere
   // gebruikers mogen helemaal geen dagrapporten opvragen
   private async bepaalToegestaneDatums(
      currentUser: RefLid, queryParams: GetObjectsOperDagRapportenRequest): Promise<Date[] | undefined>
   {
      if (this.permissieService.isBeheerder(currentUser) ||
          this.permissieService.isInstructeur(currentUser) ||
          this.permissieService.isCIMT(currentUser))
      {
         return undefined;
      }

      if (!this.permissieService.isBeheerderDDWV(currentUser) && !this.permissieService.isDDWVCrew(currentUser))
      {
         throw new HttpException("Gebruiker mag dagrapport niet opvragen", HttpStatus.UNAUTHORIZED);
      }

      const dtSpanne = queryParams.VanTot(queryParams.DATUM, queryParams.BEGIN_DATUM, queryParams.EIND_DATUM);

      const roosterResult = await this.roosterService.GetObjects(
         MaakGetObjectsRequest(GetObjectsOperRoosterRequest, {BEGIN_DATUM: dtSpanne.start, EIND_DATUM: dtSpanne.eind})
      );
      let toegestaneDatums = roosterResult.dataset
         .filter(rooster => rooster.DDWV)
         .map(rooster => new Date(rooster.DATUM));

      if (this.permissieService.isDDWVCrew(currentUser))
      {
         const dienstenResult = await this.dienstenService.GetObjects(
            MaakGetObjectsRequest(GetObjectsOperDienstenRequest, {
               BEGIN_DATUM: dtSpanne.start, EIND_DATUM: dtSpanne.eind, LID_ID: currentUser.ID
            })
         );
         const dienstDatums = new Set(dienstenResult.dataset.map(dienst => toDateOnly(dienst.DATUM)));
         toegestaneDatums = toegestaneDatums.filter(datum => dienstDatums.has(toDateOnly(datum)));
      }

      return toegestaneDatums;
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}
