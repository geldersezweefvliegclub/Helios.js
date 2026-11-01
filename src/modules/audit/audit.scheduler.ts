import {Injectable, Logger, OnApplicationBootstrap} from '@nestjs/common';
import {Cron} from '@nestjs/schedule';
import {setTimeout as wacht} from 'timers/promises';
import {DateTime} from 'luxon';
import {AuditService} from "./audit.service";
import {GetObjectsAuditRequest} from "./GetObjectsAuditRequest";
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";
import {addDagen, lokaleDatum} from "../../core/helpers/TimeDate";
import {safeStringify} from "../../core/helpers/LogHelper";
import {TIMEZONE} from "../../config/timezone";

// Alle environment variabelen zijn optioneel, zonder waarde gelden de defaults hieronder
const CRON = process.env.AUDIT_CRON || '15 4 * * *';                   // iedere dag om 04:15
const WACHTTIJD_MS = 1000;                                                    // pauze tussen het verwijderen van twee dagen, tegen overbelasting van de database
const OUDSTE_DATUM = '1970-01-01';                                            // begin van de zoekperiode voor het verwijderen van oude audit records

// Scheduler die dagelijks de audit records van meer dan AUDIT_MAANDEN_BEWAREN (default 6) maanden oud permanent verwijdert.
// AuditService.RemoveObject() vereist geen markering als verwijderd en legt zelf niets vast in de audit trail, daarom
// is er geen actor (CRONJOB_ACTOR_ID) nodig.
//
// Environment variabelen (allemaal optioneel):
//   AUDIT_SCHEDULER          false = scheduler uitschakelen (default true)
//   AUDIT_CRON               cron expressie, in de tijdzone van TIMEZONE (default '15 4 * * *')
//   AUDIT_MAANDEN_BEWAREN    aantal maanden dat audit records bewaard blijven (default 6)
//   AUDIT_RUN_ON_STARTUP     false = niet direct bij opstarten uitvoeren (default true)
@Injectable()
export class AuditScheduler implements OnApplicationBootstrap
{
   private readonly logger = new Logger(AuditScheduler.name);

   constructor(private readonly auditService: AuditService)
   {
      this.logger.log(`AuditScheduler: actief=${this.isActief()}, cron='${CRON}', tijdzone=${TIMEZONE}, maanden bewaren=${this.maandenBewaren()}`);
   }

   // standaard ook direct bij opstarten uitvoeren, AUDIT_RUN_ON_STARTUP=false schakelt dit uit
   onApplicationBootstrap(): void
   {
      if (this.isActief() && (process.env.AUDIT_RUN_ON_STARTUP ?? 'true').toLowerCase() !== 'false')
      {
         this.logger.log('AuditScheduler: audit opruimen bij opstarten');
         void this.Uitvoeren();
      }
   }

   @Cron(CRON, {name: 'VerwijderAudit', timeZone: TIMEZONE})
   async handleCron(): Promise<void>
   {
      if (!this.isActief())
         return;

      this.logger.log('AuditScheduler: audit opruimen cron');
      await this.Uitvoeren();
   }

   async Uitvoeren(): Promise<void>
   {
      try
      {
         await this.VerwijderAudit();
      }
      catch (error)
      {
         this.logger.error(`AuditScheduler: audit opruimen mislukt: ${(error as Error)?.message ?? safeStringify(error)}`, (error as Error)?.stack);
      }
   }

   // verwijdert de audit records van meer dan AUDIT_MAANDEN_BEWAREN (default 6) maanden oud permanent uit de database.
   // Lukt het verwijderen van een record niet, dan wordt het bij de volgende run opnieuw geprobeerd
   async VerwijderAudit(): Promise<void>
   {
      // grens in lokale tijd (TIMEZONE), alles vóór deze datum wordt verwijderd
      const grens = DateTime.now().setZone(TIMEZONE).startOf('day').minus({months: this.maandenBewaren()}).toISODate() as string;
      this.logger.log(`AuditScheduler: start verwijder audit, audit records voor ${grens}`);

      const filter = {
         BEGIN_DATUM: lokaleDatum(OUDSTE_DATUM),
         EIND_DATUM: lokaleDatum(addDagen(grens, -1))
      };
      const [actief, verwijderd] = await Promise.all([
         this.auditService.GetObjects(MaakGetObjectsRequest(GetObjectsAuditRequest, {...filter, VERWIJDERD: false})),
         this.auditService.GetObjects(MaakGetObjectsRequest(GetObjectsAuditRequest, {...filter, VERWIJDERD: true}))
      ]);
      // samenvoegen van de actieve en verwijderde audit records, beide kunnen direct verwijderd worden
      const kanweg = [...actief.dataset, ...verwijderd.dataset];

      // de audit records worden per dag verwijderd, DATUM is in de GetObjects response al een yyyy-MM-dd string
      const perDag = new Map<string, typeof kanweg>();
      for (const audit of kanweg)
         perDag.set(String(audit.DATUM), [...(perDag.get(String(audit.DATUM)) ?? []), audit]);
      const dagen = [...perDag.keys()].sort();

      let verwijderdAantal = 0;
      let mislukt = 0;
      for (const [index, datum] of dagen.entries())
      {
         // 1 seconde wachten voordat de volgende dag wordt verwijderd, de audit records van een dag zonder te wachten
         if (index > 0)
            await wacht(WACHTTIJD_MS);

         for (const audit of perDag.get(datum) ?? [])
         {
            try
            {
               await this.auditService.RemoveObject(audit.ID);
               verwijderdAantal++;
            }
            catch (error)
            {
               mislukt++;
               this.logger.error(`AuditScheduler: verwijderen audit ${datum} (ID=${audit.ID}) mislukt: ${(error as Error)?.message ?? safeStringify(error)}`);
            }
         }
         // per dag alleen het aantal loggen, een dag kan veel audit records bevatten
         this.logger.log(`AuditScheduler: audit van ${datum} verwijderd, ${(perDag.get(datum) ?? []).length} records`);
      }

      this.logger.log(`AuditScheduler: verwijder audit klaar, ${kanweg.length} gevonden over ${dagen.length} dagen, ${verwijderdAantal} verwijderd, ${mislukt} mislukt`);
   }

   // scheduler staat standaard aan, AUDIT_SCHEDULER=false schakelt hem uit (bv. bij meerdere instanties)
   private isActief(): boolean
   {
      return (process.env.AUDIT_SCHEDULER ?? 'true').toLowerCase() !== 'false';
   }

   private maandenBewaren(): number
   {
      const maanden = Number(process.env.AUDIT_MAANDEN_BEWAREN);
      return Number.isInteger(maanden) && maanden > 0 ? maanden : 6;
   }
}
