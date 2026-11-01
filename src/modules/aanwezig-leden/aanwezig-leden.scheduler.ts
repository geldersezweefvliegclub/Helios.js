import {Injectable, Logger, OnApplicationBootstrap} from '@nestjs/common';
import {Cron} from '@nestjs/schedule';
import {setTimeout as wacht} from 'timers/promises';
import {DateTime} from 'luxon';
import {AanwezigLedenService} from "./aanwezig-leden.service";
import {LedenService} from "../leden/leden.service";
import {GetObjectsOperAanwezigLedenRequest} from "./GetObjectsOperAanwezigLedenRequest";
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";
import {addDagen, lokaleDatum} from "../../core/helpers/TimeDate";
import {safeStringify} from "../../core/helpers/LogHelper";
import {TIMEZONE} from "../../config/timezone";

// Alle environment variabelen zijn optioneel, zonder waarde gelden de defaults hieronder
const CRON = process.env.AANWEZIG_LEDEN_CRON || '30 4 * * *';           // iedere dag om 04:30
const WACHTTIJD_MS = 1000;                                                    // pauze tussen het verwijderen van twee dagen, tegen overbelasting van de database
const OUDSTE_DATUM = '1970-01-01';                                            // begin van de zoekperiode voor het verwijderen van oude aanmeldingen

// Scheduler die dagelijks de aanwezige leden (aanmeldingen) van meer dan AANWEZIG_LEDEN_MAANDEN_BEWAREN (default 6)
// maanden oud permanent verwijdert.
//
// Environment variabelen (allemaal optioneel):
//   AANWEZIG_LEDEN_SCHEDULER        false = scheduler uitschakelen (default true)
//   AANWEZIG_LEDEN_CRON             cron expressie, in de tijdzone van TIMEZONE (default '30 4 * * *')
//   AANWEZIG_LEDEN_MAANDEN_BEWAREN  aantal maanden dat aanwezige leden bewaard blijven (default 6)
//   AANWEZIG_LEDEN_RUN_ON_STARTUP   false = niet direct bij opstarten uitvoeren (default true)
//   CRONJOB_ACTOR_ID                LID_ID voor de audit trail, gedeeld met de andere cronjobs (default beheerder met 'cronjob' in de naam, zie LedenService.CronjobActorId())
@Injectable()
export class AanwezigLedenScheduler implements OnApplicationBootstrap
{
   private readonly logger = new Logger(AanwezigLedenScheduler.name);

   constructor(private readonly aanwezigLedenService: AanwezigLedenService,
               private readonly ledenService: LedenService)
   {
      this.logger.log(`AanwezigLedenScheduler: actief=${this.isActief()}, cron='${CRON}', tijdzone=${TIMEZONE}, maanden bewaren=${this.maandenBewaren()}`);
   }

   // standaard ook direct bij opstarten uitvoeren, AANWEZIG_LEDEN_RUN_ON_STARTUP=false schakelt dit uit
   onApplicationBootstrap(): void
   {
      if (this.isActief() && (process.env.AANWEZIG_LEDEN_RUN_ON_STARTUP ?? 'true').toLowerCase() !== 'false')
      {
         this.logger.log('AanwezigLedenScheduler: aanwezige leden opruimen bij opstarten');
         void this.Uitvoeren();
      }
   }

   @Cron(CRON, {name: 'VerwijderAanwezigLeden', timeZone: TIMEZONE})
   async handleCron(): Promise<void>
   {
      if (!this.isActief())
         return;

      this.logger.log('AanwezigLedenScheduler: aanwezige leden opruimen cron');
      await this.Uitvoeren();
   }

   async Uitvoeren(): Promise<void>
   {
      try
      {
         const actorId = await this.ledenService.CronjobActorId();
         if (actorId === undefined)
         {
            this.logger.error('AanwezigLedenScheduler: geen beheerder gevonden en CRONJOB_ACTOR_ID niet gezet, aanwezige leden worden niet opgeruimd');
            return;
         }

         await this.VerwijderAanwezigLeden(actorId);
      }
      catch (error)
      {
         this.logger.error(`AanwezigLedenScheduler: aanwezige leden opruimen mislukt: ${(error as Error)?.message ?? safeStringify(error)}`, (error as Error)?.stack);
      }
   }

   // verwijdert de aanwezige leden van meer dan AANWEZIG_LEDEN_MAANDEN_BEWAREN (default 6) maanden oud permanent uit de
   // database. RemoveObject() vereist dat het record eerst gemarkeerd is als verwijderd, net als via DeleteObject. Lukt het
   // permanent verwijderen niet, dan blijft de aanmelding gemarkeerd als verwijderd staan en wordt die bij de volgende run
   // opnieuw permanent verwijderd
   async VerwijderAanwezigLeden(actorId: number): Promise<void>
   {
      // grens in lokale tijd (TIMEZONE), alles vóór deze datum wordt verwijderd
      const grens = DateTime.now().setZone(TIMEZONE).startOf('day').minus({months: this.maandenBewaren()}).toISODate() as string;
      this.logger.log(`AanwezigLedenScheduler: start verwijder aanwezige leden, aanmeldingen voor ${grens}`);

      // AanwezigLedenService.GetObjects() doet per aanmelding extra queries (vliegt/vliegtijd/starts), allemaal tegelijk.
      // Alles in één keer ophalen put de connection pool uit, daarom eerst de oudste datum bepalen en daarna per dag ophalen
      const filter = {
         BEGIN_DATUM: lokaleDatum(OUDSTE_DATUM),
         EIND_DATUM: lokaleDatum(addDagen(grens, -1)),
         SORT: 'DATUM',
         MAX: 1
      };
      const [eersteActief, eersteVerwijderd] = await Promise.all([
         this.aanwezigLedenService.GetObjects(MaakGetObjectsRequest(GetObjectsOperAanwezigLedenRequest, {...filter, VERWIJDERD: false})),
         this.aanwezigLedenService.GetObjects(MaakGetObjectsRequest(GetObjectsOperAanwezigLedenRequest, {...filter, VERWIJDERD: true}))
      ]);
      // DATUM is in de GetObjects response al een yyyy-MM-dd string
      const oudste = [...eersteActief.dataset, ...eersteVerwijderd.dataset].map((a) => String(a.DATUM)).sort()[0];

      let gevonden = 0;
      let dagen = 0;
      let verwijderdAantal = 0;
      let mislukt = 0;
      for (let datum = oudste; datum !== undefined && datum < grens; datum = addDagen(datum, 1))
      {
         const [actief, verwijderd] = await Promise.all([
            this.aanwezigLedenService.GetObjects(MaakGetObjectsRequest(GetObjectsOperAanwezigLedenRequest, {DATUM: lokaleDatum(datum), VERWIJDERD: false})),
            this.aanwezigLedenService.GetObjects(MaakGetObjectsRequest(GetObjectsOperAanwezigLedenRequest, {DATUM: lokaleDatum(datum), VERWIJDERD: true}))
         ]);
         // samenvoegen van de actieve en verwijderde aanmeldingen van deze dag
         const kanweg = [
            ...actief.dataset.map((aanwezig) => ({aanwezig, eerstVerwijderen: true})),
            ...verwijderd.dataset.map((aanwezig) => ({aanwezig, eerstVerwijderen: false}))
         ];
         if (kanweg.length === 0)
            continue;

         // 1 seconde wachten voordat de volgende dag wordt verwijderd, de aanmeldingen van een dag zonder te wachten
         if (dagen > 0)
            await wacht(WACHTTIJD_MS);
         dagen++;
         gevonden += kanweg.length;

         for (const {aanwezig, eerstVerwijderen} of kanweg)
         {
            try
            {
               if (eerstVerwijderen)
                  await this.aanwezigLedenService.UpdateObject(aanwezig.ID, {VERWIJDERD: true}, actorId);

               await this.aanwezigLedenService.RemoveObject(aanwezig.ID, actorId);
               verwijderdAantal++;
            }
            catch (error)
            {
               mislukt++;
               this.logger.error(`AanwezigLedenScheduler: verwijderen aanmelding ${datum} (ID=${aanwezig.ID}) mislukt: ${(error as Error)?.message ?? safeStringify(error)}`);
            }
         }
         this.logger.log(`AanwezigLedenScheduler: aanwezige leden van ${datum} verwijderd, ${kanweg.length} aanmeldingen`);
      }

      this.logger.log(`AanwezigLedenScheduler: verwijder aanwezige leden klaar, ${gevonden} gevonden over ${dagen} dagen, ${verwijderdAantal} verwijderd, ${mislukt} mislukt`);
   }

   // scheduler staat standaard aan, AANWEZIG_LEDEN_SCHEDULER=false schakelt hem uit (bv. bij meerdere instanties)
   private isActief(): boolean
   {
      return (process.env.AANWEZIG_LEDEN_SCHEDULER ?? 'true').toLowerCase() !== 'false';
   }

   private maandenBewaren(): number
   {
      const maanden = Number(process.env.AANWEZIG_LEDEN_MAANDEN_BEWAREN);
      return Number.isInteger(maanden) && maanden > 0 ? maanden : 6;
   }
}
