import {
   Controller,
   HttpException,
   HttpStatus,
   Query
} from '@nestjs/common';
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {GetObjectRequest} from "../../core/DTO/IHeliosFilter";
import {
   HeliosController,
   HeliosGetObject,
   HeliosGetObjects
} from "../../core/controllers/helios/helios.controller";
import {AuditService} from "./audit.service";
import {AuditDto} from "../../generated/nestjs-dto/audit.dto";
import {GetObjectsAuditRequest} from "./GetObjectsAuditRequest";
import {OnEvent} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {ConfigService} from "@nestjs/config";
import {ApiTags} from "@nestjs/swagger";
import {GetObjectsAuditResponse} from "./GetObjectsAuditResponse";
import {PermissieService} from "../authorisatie/permissie.service";
import {CurrentUser} from "../login/current-user.decorator";
import {RefLid} from "@prisma/client";

@Controller('Audit')
@ApiTags('Audit')
export class AuditController extends HeliosController
{
   excludeClasses = ['ABCD'];
   constructor(private readonly auditService: AuditService,
               private readonly configService: ConfigService,
               private readonly permissieService:PermissieService)
   {
      super()

      // excludeClasses is a list of classes that should not be audited
      const excludeAudit: string[] = this.configService.getOrThrow<string[]>('LOGGING.EXCLUDE_AUDIT');
      if (excludeAudit) {
         this.excludeClasses = this.excludeClasses.concat(excludeAudit)
      }
   }


   @HeliosGetObject(AuditDto)
   async GetObject(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectRequest): Promise<AuditDto>
   {
      this.permissieService.heeftToegang(user, 'Audit.GetObject');

      const obj =  await this.auditService.GetObject(queryParams.ID);

      // record moet van de user zijn of de gebruiker moet beheerder zijn
      if (!this.permissieService.isBeheerder(user) && obj.LID_ID !== user.ID) {
         throw new HttpException(`Geen eigenaar`, HttpStatus.UNAUTHORIZED);
      }
      return obj;
   }

   // retrieve objects from the database based on the query parameters
   @HeliosGetObjects(GetObjectsAuditResponse)
   GetObjects(
      @CurrentUser() user: RefLid,
      @Query() queryParams: GetObjectsAuditRequest): Promise<IHeliosGetObjectsResponse<GetObjectsAuditResponse>>
   {
      this.permissieService.heeftToegang(user, 'Audit.GetObjects');
      // als de gebruiker geen beheerder is, dan mag hij alleen zijn eigen records zien
      if (!this.permissieService.isBeheerder(user)) {
         queryParams.LID_ID = user.ID;
      }
      return this.auditService.GetObjects(queryParams);
   }

   // listen to events from the database actions
   // store data in the audit table when a record is added
   @OnEvent(DatabaseEvents.Created)
   CreatedRecord(objNaam: string, id: number, data: unknown, result: unknown)
   {
      // Niet alles mag in de audit trail
      if (this.excludeClasses.includes(objNaam))
         return;

      const record = {
         DATUM: new Date(),
         LID_ID: 0,
         ID: id,
         TABEL_NAAM: objNaam,
         DATA: JSON.stringify(data),
         RESULTAAT: JSON.stringify(result),
         ACTIE: 'Toevoegen'
      }
      this.auditService.AddObject(record);
   }


   //----------------------------------------------------------------------------------------------------------------------------------//
   // listen to events from the database actions
   // store data in the audit table when a record is updated
   @OnEvent(DatabaseEvents.Updated)
   UpdatedRecord(objNaam: string, id: number, before: unknown, data: unknown, result: unknown)
   {
      // Niet alles mag in de audit trail
      if (this.excludeClasses.includes(objNaam))
         return;

      const record = {
         DATUM: new Date(),
         LID_ID: 0,
         ID: id,
         TABEL_NAAM: objNaam,
         VOOR: JSON.stringify(before),
         DATA: JSON.stringify(data),
         RESULTAAT: JSON.stringify(result),
         ACTIE: 'Aanpassen'
      }
      this.auditService.AddObject(record);
   }


   // listen to events from the database actions
   // store data in the audit table when a record is removed
   @OnEvent(DatabaseEvents.Removed)
   RemovedRecord(objNaam: string, id: number, data: unknown)
   {
      // Niet alles mag in de audit trail
      if (this.excludeClasses.includes(objNaam))
         return;

      const record = {
         DATUM: new Date(),
         LID_ID: 0,
         ID: id,
         TABEL_NAAM: objNaam,
         VOOR: JSON.stringify(data),
         ACTIE: 'Verwijderd'
      }
      this.auditService.AddObject(record);
   }

   //------------- Specifieke endpoints staan hieronder --------------------//


}
