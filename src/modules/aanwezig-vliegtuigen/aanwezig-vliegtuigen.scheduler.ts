import {Injectable, Logger, OnApplicationBootstrap} from '@nestjs/common';
import {Cron} from '@nestjs/schedule';
import {setTimeout as wacht} from 'timers/promises';
import {DateTime} from 'luxon';
import {AanwezigVliegtuigenService} from "./aanwezig-vliegtuigen.service";
import {LedenService} from "../leden/leden.service";
import {GetObjectsOperAanwezigVliegtuigenRequest} from "./GetObjectsOperAanwezigVliegtuigenRequest";
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";
import {addDagen, lokaleDatum} from "../../core/helpers/TimeDate";
import {safeStringify} from "../../core/helpers/LogHelper";
import {TIMEZONE} from "../../config/timezone";

// Alle environment variabelen zijn optioneel, zonder waarde gelden de defaults hieronder
const CRON = process.env.AANWEZIG_VLIEGTUIGEN_CRON || '45 4 * * *';     // iedere dag om 04:45
const WACHTTIJD_MS = 1000;                                                    // pauze tussen het verwijderen van twee dagen, tegen overbelasting van de database
const OUDSTE_DATUM = '1970-01-01';                                            // begin van de zoekperiode voor het verwijderen van oude aanmeldingen

// Scheduler die dagelijks de aanwezige vliegtuigen (aanmeldingen) van meer dan AANWEZIG_VLIEGTUIGEN_MAANDEN_BEWAREN (default 6)
// maanden oud permanent verwijdert. Anders dan bij de AanwezigLedenScheduler worden alle oude aanmeldingen in één keer
// opgehaald, GetObjects() doet hier maar één lichte extra query per aanmelding.
//
// Environment variabelen (allemaal optioneel):
//   AANWEZIG_VLIEGTUIGEN_SCHEDULER        false = scheduler uitschakelen (default true)
//   AANWEZIG_VLIEGTUIGEN_CRON             cron expressie, in de tijdzone van TIMEZONE (default '45 4 * * *')
//   AANWEZIG_VLIEGTUIGEN_MAANDEN_BEWAREN  aantal maanden dat aanwezige vliegtuigen bewaard blijven (default 6)
//   AANWEZIG_VLIEGTUIGEN_RUN_ON_STARTUP   false = niet direct bij opstarten uitvoeren (default true)
//   CRONJOB_ACTOR_ID                      LID_ID voor de audit trail, gedeeld met de andere cronjobs (default beheerder met 'cronjob' in de naam, zie LedenService.CronjobActorId())
@Injectable()
export class AanwezigVliegtuigenScheduler implements OnApplicationBootstrap
{
   private readonly logger = new Logger(AanwezigVliegtuigenScheduler.name);

   constructor(private readonly aanwezigVliegtuigenService: AanwezigVliegtuigenService,
               private readonly ledenService: LedenService)
   {
      this.logger.log(`AanwezigVliegtuigenScheduler: actief=${this.isActief()}, cron='${CRON}', tijdzone=${TIMEZONE}, maanden bewaren=${this.maandenBewaren()}`);
   }

   // standaard ook direct bij opstarten uitvoeren, AANWEZIG_VLIEGTUIGEN_RUN_ON_STARTUP=false schakelt dit uit
   onApplicationBootstrap(): void
   {
      if (this.isActief() && (process.env.AANWEZIG_VLIEGTUIGEN_RUN_ON_STARTUP ?? 'true').toLowerCase() !== 'false')
      {
         this.logger.log('AanwezigVliegtuigenScheduler: aanwezige vliegtuigen opruimen bij opstarten');
         void this.Uitvoeren();
      }
   }

   @Cron(CRON, {name: 'VerwijderAanwezigVliegtuigen', timeZone: TIMEZONE})
   async handleCron(): Promise<void>
   {
      if (!this.isActief())
         return;

      this.logger.log('AanwezigVliegtuigenScheduler: aanwezige vliegtuigen opruimen cron');
      await this.Uitvoeren();
   }

   async Uitvoeren(): Promise<void>
   {
      try
      {
         const actorId = await this.ledenService.CronjobActorId();
         if (actorId === undefined)
         {
            this.logger.error('AanwezigVliegtuigenScheduler: geen beheerder gevonden en CRONJOB_ACTOR_ID niet gezet, aanwezige vliegtuigen worden niet opgeruimd');
            return;
         }

         await this.VerwijderAanwezigVliegtuigen(actorId);
      }
      catch (error)
      {
         this.logger.error(`AanwezigVliegtuigenScheduler: aanwezige vliegtuigen opruimen mislukt: ${(error as Error)?.message ?? safeStringify(error)}`, (error as Error)?.stack);
      }
   }

   // verwijdert de aanwezige vliegtuigen van meer dan AANWEZIG_VLIEGTUIGEN_MAANDEN_BEWAREN (default 6) maanden oud permanent uit de database.
   // RemoveObject() vereist dat het record eerst gemarkeerd is als verwijderd, net als via DeleteObject. Lukt het
   // permanent verwijderen niet, dan blijft de aanmelding gemarkeerd als verwijderd staan en wordt die bij de volgende run
   // opnieuw permanent verwijderd
   async VerwijderAanwezigVliegtuigen(actorId: number): Promise<void>
   {
      // grens in lokale tijd (TIMEZONE), alles vóór deze datum wordt verwijderd
      const grens = DateTime.now().setZone(TIMEZONE).startOf('day').minus({months: this.maandenBewaren()}).toISODate() as string;
      this.logger.log(`AanwezigVliegtuigenScheduler: start verwijder aanwezige vliegtuigen, aanmeldingen voor ${grens}`);

      const filter = {
         BEGIN_DATUM: lokaleDatum(OUDSTE_DATUM),
         EIND_DATUM: lokaleDatum(addDagen(grens, -1))
      };
      const [actief, verwijderd] = await Promise.all([
         this.aanwezigVliegtuigenService.GetObjects(MaakGetObjectsRequest(GetObjectsOperAanwezigVliegtuigenRequest, {...filter, VERWIJDERD: false})),
         this.aanwezigVliegtuigenService.GetObjects(MaakGetObjectsRequest(GetObjectsOperAanwezigVliegtuigenRequest, {...filter, VERWIJDERD: true}))
      ]);
      // samenvoegen van de actieve en verwijderde aanmeldingen
      const kanweg = [
         ...actief.dataset.map((aanwezig) => ({aanwezig, eerstVerwijderen: true})),
         ...verwijderd.dataset.map((aanwezig) => ({aanwezig, eerstVerwijderen: false}))
      ];

      // de aanmeldingen worden per dag verwijderd, DATUM is in de GetObjects response al een yyyy-MM-dd string
      const perDag = new Map<string, typeof kanweg>();
      for (const item of kanweg)
         perDag.set(String(item.aanwezig.DATUM), [...(perDag.get(String(item.aanwezig.DATUM)) ?? []), item]);
      const dagen = [...perDag.keys()].sort();

      let verwijderdAantal = 0;
      let mislukt = 0;
      for (const [index, datum] of dagen.entries())
      {
         // 1 seconde wachten voordat de volgende dag wordt verwijderd, de aanmeldingen van een dag zonder te wachten
         if (index > 0)
            await wacht(WACHTTIJD_MS);

         for (const {aanwezig, eerstVerwijderen} of perDag.get(datum) ?? [])
         {
            try
            {
               if (eerstVerwijderen)
                  await this.aanwezigVliegtuigenService.UpdateObject(aanwezig.ID, {VERWIJDERD: true}, actorId);

               await this.aanwezigVliegtuigenService.RemoveObject(aanwezig.ID, actorId);
               verwijderdAantal++;
            }
            catch (error)
            {
               mislukt++;
               this.logger.error(`AanwezigVliegtuigenScheduler: verwijderen aanmelding ${datum} (ID=${aanwezig.ID}) mislukt: ${(error as Error)?.message ?? safeStringify(error)}`);
            }
         }
         this.logger.log(`AanwezigVliegtuigenScheduler: aanwezige vliegtuigen van ${datum} verwijderd, ${(perDag.get(datum) ?? []).length} aanmeldingen`);
      }

      this.logger.log(`AanwezigVliegtuigenScheduler: verwijder aanwezige vliegtuigen klaar, ${kanweg.length} gevonden over ${dagen.length} dagen, ${verwijderdAantal} verwijderd, ${mislukt} mislukt`);
   }

   // scheduler staat standaard aan, AANWEZIG_VLIEGTUIGEN_SCHEDULER=false schakelt hem uit (bv. bij meerdere instanties)
   private isActief(): boolean
   {
      return (process.env.AANWEZIG_VLIEGTUIGEN_SCHEDULER ?? 'true').toLowerCase() !== 'false';
   }

   private maandenBewaren(): number
   {
      const maanden = Number(process.env.AANWEZIG_VLIEGTUIGEN_MAANDEN_BEWAREN);
      return Number.isInteger(maanden) && maanden > 0 ? maanden : 6;
   }
}
