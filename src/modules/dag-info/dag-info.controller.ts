
import {Body, Controller, Logger, Query} from '@nestjs/common';
import {DagInfoService} from "./dag-info.service";
import {PermissieService} from "../authorisatie/permissie.service";
import {
   HeliosController,
   HeliosCreateObject, HeliosDeleteObject,
   HeliosGetObject,
   HeliosGetObjects, HeliosRemoveObject, HeliosRestoreObject,
   HeliosUpdateObject
} from "../../core/controllers/helios/helios.controller";
import {OperDagInfoDto} from "../../generated/nestjs-dto/operDagInfo.dto";
import {CurrentUser} from "../login/current-user.decorator";
import {Prisma, RefLid} from "@prisma/client";
import {GetObjectsOperDagInfoResponse} from "./GetObjectsOperDagInfoResponse";
import {GetObjectsOperDagInfoRequest} from "./GetObjectsOperDagInfoRequest";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {CreateOperDagInfoDto} from "../../generated/nestjs-dto/create-operDagInfo.dto";
import {UpdateOperDagInfoDto} from "../../generated/nestjs-dto/update-operDagInfo.dto";
import {ApiTags} from "@nestjs/swagger";
import {GetObjectOperDagInfoRequest} from "./GetObjectOperDagInfoRequest";
import {safeStringify} from "../../core/helpers/LogHelper";
import {bodyHeeftData} from "../../core/helpers/RequestGuards";
import {parseDateOnly, toDateOnly} from "../../core/helpers/TimeDate";
import {RoosterService} from "../rooster/rooster.service";
import {DienstenService} from "../diensten/diensten.service";
import {GetObjectsOperRoosterRequest} from "../rooster/GetObjectsOperRoosterRequest";
import {GetObjectsOperDienstenRequest} from "../diensten/GetObjectsOperDienstenRequest";
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";

@Controller('Daginfo')
@ApiTags('Daginfo')
export class DagInfoController  extends HeliosController
{
   private readonly logger = new Logger(DagInfoController.name);

   constructor(private readonly DagInfoService: DagInfoService,
               private readonly permissieService:PermissieService,
               private readonly roosterService: RoosterService,
               private readonly dienstenService: DienstenService)
   {
      super()
   }

   @HeliosGetObject(OperDagInfoDto)
   async GetObject(
      @CurrentUser() currentUser: RefLid,
      @Query() params: GetObjectOperDagInfoRequest
   ): Promise<OperDagInfoDto>
   {
      this.logger.verbose(`DagInfoController.GetObject(${safeStringify({currentUser, params})})`);
      this.permissieService.heeftToegang(currentUser, 'DagInfo.GetObject');
      this.heeftDataToegangGetObject(currentUser);
      const obj = await this.DagInfoService.GetObject(params.ID, params.DATUM);
      const masked = await this.maskeerDienstenVoorGebruiker(obj, currentUser);
      return {...masked, DATUM: toDateOnly(masked.DATUM) as unknown as Date};
   }

   @HeliosGetObjects(GetObjectsOperDagInfoResponse)
   async GetObjects(
      @CurrentUser() currentUser: RefLid,
      @Query() queryParams: GetObjectsOperDagInfoRequest): Promise<IHeliosGetObjectsResponse<GetObjectsOperDagInfoResponse>>
   {
      this.logger.verbose(`DagInfoController.GetObjects(${safeStringify({currentUser, queryParams})})`);
      this.permissieService.heeftToegang(currentUser, 'DagInfo.GetObjects');
      this.heeftDataToegangGetObjects(currentUser);
      const result = await this.DagInfoService.GetObjects(queryParams);
      result.dataset = await Promise.all(
         result.dataset.map(record => this.maskeerDienstenVoorGebruiker(record, currentUser))
      );
      return result;
   }

   @HeliosCreateObject(CreateOperDagInfoDto, OperDagInfoDto)
   async AddObject(
      @CurrentUser() currentUser: RefLid,
      @Body() data: CreateOperDagInfoDto): Promise<OperDagInfoDto>
   {
      this.logger.verbose(`DagInfoController.AddObject(${safeStringify({currentUser, data})})`);
      bodyHeeftData(data);
      this.permissieService.heeftToegang(currentUser, 'DagInfo.AddObject');
      this.heeftDataToegangAddObject(currentUser);

      const insert = await this.normaliserenData(data) as Prisma.OperDagInfoUncheckedCreateInput;
      const obj = await this.DagInfoService.AddObject(insert, currentUser.ID);
      return {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
   }

   @HeliosUpdateObject(UpdateOperDagInfoDto, OperDagInfoDto)
   async UpdateObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number, @Body() data: UpdateOperDagInfoDto): Promise<OperDagInfoDto>
   {
      bodyHeeftData(data);
      id = id ?? data.ID;
      this.logger.verbose(`DagInfoController.UpdateObject(${safeStringify({currentUser, id, data})})`);
      this.permissieService.heeftToegang(currentUser, 'DagInfo.UpdateObject');
      this.heeftDataToegangUpdateObject(currentUser);

      const update = await this.normaliserenData(data) as Prisma.OperDagInfoUncheckedUpdateInput;
      const obj = await this.DagInfoService.UpdateObject(id, update, currentUser.ID);
      return {...obj, DATUM: toDateOnly(obj.DATUM) as unknown as Date};
   }

   @HeliosDeleteObject()
   async DeleteObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DagInfoController.DeleteObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'DagInfo.DeleteObject');
      this.heeftDataToegangDeleteObject(currentUser);

      const data: Prisma.OperDagInfoUncheckedUpdateInput = {
         VERWIJDERD: true
      }
      await this.DagInfoService.UpdateObject(id, data, currentUser.ID);
   }

   @HeliosRemoveObject()
   async RemoveObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DagInfoController.RemoveObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'DagInfo.RemoveObject');
      this.heeftDataToegangRemoveObject(currentUser);
      await this.DagInfoService.RemoveObject(id, currentUser.ID);
   }

   @HeliosRestoreObject()
   async RestoreObject(
      @CurrentUser() currentUser: RefLid,
      @Query('ID') id: number): Promise<void>
   {
      this.logger.verbose(`DagInfoController.RestoreObject(${safeStringify({currentUser, id})})`);
      this.permissieService.heeftToegang(currentUser, 'DagInfo.RestoreObject');
      this.heeftDataToegangRestoreObject(currentUser);

      const data: Prisma.OperDagInfoUncheckedUpdateInput = {
         VERWIJDERD: false
      }
      await this.DagInfoService.UpdateObject(id, data, currentUser.ID);
   }

   // gedeelde verwerking van AddObject en UpdateObject: verwijdert de niet-instelbare velden en
   // normaliseert het datumveld
   private async normaliserenData(
      data: CreateOperDagInfoDto | UpdateOperDagInfoDto): Promise<Prisma.OperDagInfoUncheckedCreateInput | Prisma.OperDagInfoUncheckedUpdateInput>
   {
      // VERWIJDERD, LAATSTE_AANPASSING en ID zijn nooit direct instelbaar door de client - ook al accepteert de
      // DTO ze (zodat een eerder opgehaald record ongewijzigd teruggestuurd kan worden), een meegegeven
      // waarde wordt hier altijd genegeerd
      delete data.VERWIJDERD;
      delete data.LAATSTE_AANPASSING;
      delete data.ID;

      // zorg dat de datum omgezet wordt in ISO 8601 formaat
      data.DATUM = parseDateOnly(data.DATUM as Date | string) as Date;

      return data as Prisma.OperDagInfoUncheckedCreateInput | Prisma.OperDagInfoUncheckedUpdateInput;
   }

   // DIENSTEN mogen enkel gezien worden door Beheerder/Instructeur/CIMT (altijd), Starttoren (enkel voor vandaag),
   // en DDWV-Beheerder/DDWV-Crew (enkel op DDWV-dagen, Crew bovendien enkel als ze zelf op die dag zijn ingedeeld).
   // Alle andere gebruikers zien DIENSTEN nooit.
   private async maskeerDienstenVoorGebruiker<T extends { DATUM: Date | string; DIENSTEN: string | null }>(
      record: T, currentUser: RefLid): Promise<T>
   {
      if (record.DIENSTEN == null)
         return record;

      if (this.permissieService.isBeheerder(currentUser) ||
          this.permissieService.isInstructeur(currentUser) ||
          this.permissieService.isCIMT(currentUser))
      {
         return record;
      }

      const datum = record.DATUM instanceof Date ? record.DATUM : new Date(record.DATUM);

      if (this.permissieService.isStarttoren(currentUser))
      {
         if (toDateOnly(datum) !== toDateOnly(new Date()))
            return {...record, DIENSTEN: null};
         return record;
      }

      if (this.permissieService.isBeheerderDDWV(currentUser) || this.permissieService.isDDWVCrew(currentUser))
      {
         const roosterResult = await this.roosterService.GetObjects(
            MaakGetObjectsRequest(GetObjectsOperRoosterRequest, {DATUM: datum})
         );
         const isDDWVDag = roosterResult.dataset[0]?.DDWV ?? false;

         if (!isDDWVDag)
            return {...record, DIENSTEN: null};

         if (this.permissieService.isDDWVCrew(currentUser))
         {
            const dienstenResult = await this.dienstenService.GetObjects(
               MaakGetObjectsRequest(GetObjectsOperDienstenRequest, {DATUM: datum, LID_ID: currentUser.ID})
            );
            if (dienstenResult.totaal === 0)
               return {...record, DIENSTEN: null};
         }
         return record;
      }

      return {...record, DIENSTEN: null};
   }

   //------------- Specifieke endpoints staan hieronder --------------------//

   // controleer of de gebruiker toegang heeft tot de data van DagInfo/GetObject
   private heeftDataToegangGetObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van DagInfo/GetObjects
   private heeftDataToegangGetObjects(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van DagInfo/AddObject
   private heeftDataToegangAddObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van DagInfo/UpdateObject
   private heeftDataToegangUpdateObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van DagInfo/DeleteObject
   private heeftDataToegangDeleteObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van DagInfo/RemoveObject
   private heeftDataToegangRemoveObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }

   // controleer of de gebruiker toegang heeft tot de data van DagInfo/RestoreObject
   private heeftDataToegangRestoreObject(_currentUser: RefLid): void
   {
      // throw new HttpException("Geen toegang", HttpStatus.UNAUTHORIZED);
   }
}
