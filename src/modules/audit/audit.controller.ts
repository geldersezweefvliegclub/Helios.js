import {
   Controller,
   HttpException,
   HttpStatus,
   Query
} from '@nestjs/common';
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsReponse";
import {GetObjectRequest} from "../../core/DTO/IHeliosFilter";
import {
   HeliosController,
   HeliosGetObject,
   HeliosGetObjects
} from "../../core/controllers/helios/helios.controller";
import {AuditService} from "./audit.service";
import {AuditDto} from "../../generated/nestjs-dto/audit.dto";
import {GetObjectsAuditRequest} from "./AuditDTO";
import {OnEvent} from "@nestjs/event-emitter";
import {DatabaseEvents} from "../../core/helpers/Events";
import {ConfigService} from "@nestjs/config";

@Controller('Audit')
export class AuditController extends HeliosController
{
   excludeClasses = ['ABCD'];
   constructor(private readonly configService: ConfigService,
               private readonly auditService: AuditService)
   {
      super()

      // excludeClasses is a list of classes that should not be audited
      const excludeAudit: string[] = this.configService.get('logging.excludeAudit');
      if (excludeAudit) {
         this.excludeClasses = this.excludeClasses.concat(excludeAudit)
      }
   }


   @HeliosGetObject(AuditDto)
   async GetObject(@Query() queryParams: GetObjectRequest): Promise<AuditDto>
   {
      const obj =  await this.auditService.GetObject(queryParams.ID);
      if (!obj)
         throw new HttpException(`Record with ID ${queryParams.ID} not found`, HttpStatus.NOT_FOUND);

      return obj;
   }

   // retrieve objects from the database based on the query parameters
   @HeliosGetObjects(AuditDto)
   GetObjects(@Query() queryParams: GetObjectsAuditRequest): Promise<IHeliosGetObjectsResponse<AuditDto>>
   {
      return this.auditService.GetObjects(queryParams);
   }

   // listen to events from the database actions
   // store data in the audit table
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
}
