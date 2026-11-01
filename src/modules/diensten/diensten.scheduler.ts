import {Injectable, Logger, OnApplicationBootstrap} from '@nestjs/common';
import {Cron} from '@nestjs/schedule';
import {setTimeout as wacht} from 'timers/promises';
import {DateTime} from 'luxon';
import {DienstenService} from "./diensten.service";
import {LedenService} from "../leden/leden.service";
import {GetObjectsOperDienstenRequest} from "./GetObjectsOperDienstenRequest";
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";
import {addDagen, lokaleDatum} from "../../core/helpers/TimeDate";
import {safeStringify} from "../../core/helpers/LogHelper";
import {TIMEZONE} from "../../config/timezone";

// Alle environment variabelen zijn optioneel, zonder waarde gelden de defaults hieronder
const CRON = process.env.DIENSTEN_CRON || '0 4 * * *';                 // iedere dag om 04:00, voor de RoosterScheduler
const WACHTTIJD_MS = 1000;                                                    // pauze tussen het verwijderen van twee dagen, tegen overbelasting van de database
const OUDSTE_DATUM = '1970-01-01';                                            // begin van de zoekperiode voor het verwijderen van oude diensten

// Scheduler die dagelijks de diensten van meer dan MAANDEN_BEWAREN (default 12) maanden oud permanent verwijdert.
// Draait standaard een uur voor de RoosterScheduler, die met dezelfde periode de roosterdagen verwijdert - een roosterdag
// waar nog diensten naar verwijzen kan niet verwijderd worden (foreign key), de RoosterScheduler start dan na 30 seconden
// opnieuw.
//
// Environment variabelen (allemaal optioneel):
//   DIENSTEN_SCHEDULER       false = scheduler uitschakelen (default true)
//   DIENSTEN_CRON            cron expressie, in de tijdzone van TIMEZONE (default '0 4 * * *')
//   MAANDEN_BEWAREN          aantal maanden dat oude diensten en roosterdagen bewaard blijven (default 12)
//   DIENSTEN_RUN_ON_STARTUP  false = niet direct bij opstarten uitvoeren (default true)
//   CRONJOB_ACTOR_ID        LID_ID voor de audit trail, gedeeld met de andere cronjobs (default beheerder met 'cronjob' in de naam, zie LedenService.CronjobActorId())
@Injectable()
export class DienstenScheduler implements OnApplicationBootstrap
{
   private readonly logger = new Logger(DienstenScheduler.name);

   constructor(private readonly dienstenService: DienstenService,
               private readonly ledenService: LedenService)
   {
      this.logger.log(`DienstenScheduler: actief=${this.isActief()}, cron='${CRON}', tijdzone=${TIMEZONE}, maanden bewaren=${this.maandenBewaren()}`);
   }

   // standaard ook direct bij opstarten uitvoeren, DIENSTEN_RUN_ON_STARTUP=false schakelt dit uit
   onApplicationBootstrap(): void
   {
      if (this.isActief() && (process.env.DIENSTEN_RUN_ON_STARTUP ?? 'true').toLowerCase() !== 'false')
      {
         this.logger.log('DienstenScheduler: diensten opruimen bij opstarten');
         void this.Uitvoeren();
      }
   }

   @Cron(CRON, {name: 'VerwijderDiensten', timeZone: TIMEZONE})
   async handleCron(): Promise<void>
   {
      if (!this.isActief())
         return;

      this.logger.log('DienstenScheduler: diensten opruimen cron');
      await this.Uitvoeren();
   }

   async Uitvoeren(): Promise<void>
   {
      try
      {
         const actorId = await this.ledenService.CronjobActorId();
         if (actorId === undefined)
         {
            this.logger.error('DienstenScheduler: geen beheerder gevonden en CRONJOB_ACTOR_ID niet gezet, diensten worden niet opgeruimd');
            return;
         }

         await this.VerwijderDiensten(actorId);
      }
      catch (error)
      {
         this.logger.error(`DienstenScheduler: diensten opruimen mislukt: ${(error as Error)?.message ?? safeStringify(error)}`, (error as Error)?.stack);
      }
   }

   // verwijdert de diensten van meer dan MAANDEN_BEWAREN (default 12) maanden oud permanent uit de database.
   // RemoveObject() vereist dat het record eerst gemarkeerd is als verwijderd, net als via DeleteObject. Lukt het
   // permanent verwijderen niet, dan blijft de dienst gemarkeerd als verwijderd staan en wordt die bij de volgende run
   // opnieuw permanent verwijderd
   async VerwijderDiensten(actorId: number): Promise<void>
   {
      // grens in lokale tijd (TIMEZONE), alles vóór deze datum wordt verwijderd
      const grens = DateTime.now().setZone(TIMEZONE).startOf('day').minus({months: this.maandenBewaren()}).toISODate() as string;
      this.logger.log(`DienstenScheduler: start verwijder diensten, diensten voor ${grens}`);

      const filter = {
         BEGIN_DATUM: lokaleDatum(OUDSTE_DATUM),
         EIND_DATUM: lokaleDatum(addDagen(grens, -1))
      };
      const [actief, verwijderd] = await Promise.all([
         this.dienstenService.GetObjects(MaakGetObjectsRequest(GetObjectsOperDienstenRequest, {...filter, VERWIJDERD: false})),
         this.dienstenService.GetObjects(MaakGetObjectsRequest(GetObjectsOperDienstenRequest, {...filter, VERWIJDERD: true}))
      ]);
      // samenvoegen van de actieve en verwijderde diensten
      const kanweg = [
         ...actief.dataset.map((dienst) => ({dienst, eerstVerwijderen: true})),
         ...verwijderd.dataset.map((dienst) => ({dienst, eerstVerwijderen: false}))
      ];

      // de diensten worden in batchea per dag verwijderd, DATUM is in de GetObjects response al een yyyy-MM-dd string
      const perDag = new Map<string, typeof kanweg>();
      for (const item of kanweg)
         perDag.set(String(item.dienst.DATUM), [...(perDag.get(String(item.dienst.DATUM)) ?? []), item]);
      const dagen = [...perDag.keys()].sort();

      let verwijderdAantal = 0;
      let mislukt = 0;
      for (const [index, datum] of dagen.entries())
      {
         // 1 seconde wachten voordat de volgende dag wordt verwijderd, de diensten van een dag zonder te wachten
         if (index > 0)
            await wacht(WACHTTIJD_MS);

         for (const {dienst, eerstVerwijderen} of perDag.get(datum) ?? [])
         {
            try
            {
               if (eerstVerwijderen)
                  await this.dienstenService.UpdateObject(dienst.ID, {VERWIJDERD: true}, actorId);

               await this.dienstenService.RemoveObject(dienst.ID, actorId);
               verwijderdAantal++;
            }
            catch (error)
            {
               mislukt++;
               this.logger.error(`DienstenScheduler: verwijderen dienst ${dienst.DATUM} (ID=${dienst.ID}) mislukt: ${(error as Error)?.message ?? safeStringify(error)}`);
            }
         }
         this.logger.log(`DienstenScheduler: diensten van ${datum} verwijderd, IDs=${(perDag.get(datum) ?? []).map((item) => item.dienst.ID).join(',')}`);
      }

      this.logger.log(`DienstenScheduler: verwijder diensten klaar, ${kanweg.length} gevonden over ${dagen.length} dagen, ${verwijderdAantal} verwijderd, ${mislukt} mislukt`);
   }

   // scheduler staat standaard aan, DIENSTEN_SCHEDULER=false schakelt hem uit (bv. bij meerdere instanties)
   private isActief(): boolean
   {
      return (process.env.DIENSTEN_SCHEDULER ?? 'true').toLowerCase() !== 'false';
   }

   private maandenBewaren(): number
   {
      const maanden = Number(process.env.MAANDEN_BEWAREN);
      return Number.isInteger(maanden) && maanden > 0 ? maanden : 12;
   }
}
