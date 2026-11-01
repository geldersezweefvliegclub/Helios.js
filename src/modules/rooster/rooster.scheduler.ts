import {Injectable, Logger, OnApplicationBootstrap} from '@nestjs/common';
import {Cron} from '@nestjs/schedule';
import {setTimeout as wacht} from 'timers/promises';
import {DateTime} from 'luxon';
import {Prisma} from "@prisma/client";
import {RoosterService} from "./rooster.service";
import {LedenService} from "../leden/leden.service";
import {GetObjectsOperRoosterRequest} from "./GetObjectsOperRoosterRequest";
import {MaakGetObjectsRequest} from "../../core/helpers/MaakGetObjectsRequest";
import {addDagen, lokaleDatum} from "../../core/helpers/TimeDate";
import {safeStringify} from "../../core/helpers/LogHelper";
import {TIMEZONE} from "../../config/timezone";

// Alle environment variabelen zijn optioneel, zonder waarde gelden de defaults hieronder
const CRON = process.env.ROOSTER_CRON || '0 5 * * *';                         // iedere dag om 05:00
const WACHTTIJD_MS = 1000;                                                    // pauze tussen het aanmaken/verwijderen van twee dagen, tegen overbelasting van de database
const OPSTART_VERTRAGING_MS = 30000;                                          // wachttijd bij opstarten, zodat de DienstenScheduler eerst de oude diensten verwijdert
const HERSTART_VERTRAGING_MS = 30000;                                         // wachttijd voor een herstart als het verwijderen wordt tegengehouden door nog bestaande diensten
const MAX_HERSTARTS = 5;                                                      // maximaal aantal herstarts van VerwijderRooster per run
const OUDSTE_DATUM = '1970-01-01';                                            // begin van de zoekperiode voor het verwijderen van oude roosterdagen
const FOREIGN_KEY_FOUT = 'P2003';                                             // Prisma foutcode: foreign key constraint, er verwijzen nog diensten naar de roosterdag

// Scheduler die dagelijks controleert of er voor iedere dag vanaf vandaag t/m ROOSTER_DAGEN_VOORUIT (default 730)
// een rooster record bestaat, en de ontbrekende dagen aanmaakt. Overgenomen uit het project heliosMaakRooster.
// Daarna worden de roosterdagen van meer dan MAANDEN_BEWAREN (default 12) maanden oud permanent verwijderd, dezelfde
// periode als de DienstenScheduler.
// De default waarden van een nieuwe roosterdag (CLUB_BEDRIJF, DDWV, WINTER_WERK) worden bepaald door RoosterService.AddObject()
//
// Environment variabelen (allemaal optioneel):
//   ROOSTER_SCHEDULER       false = scheduler uitschakelen (default true)
//   ROOSTER_CRON            cron expressie (default '0 5 * * *')
//   ROOSTER_DAGEN_VOORUIT   aantal dagen vooruit (default 730)
//   MAANDEN_BEWAREN         aantal maanden dat oude roosterdagen en diensten bewaard blijven (default 12)
//   ROOSTER_RUN_ON_STARTUP  false = niet direct bij opstarten uitvoeren (default true)
//   CRONJOB_ACTOR_ID        LID_ID voor de audit trail, gedeeld met de andere cronjobs (default beheerder met 'cronjob' in de naam, zie LedenService.CronjobActorId())
@Injectable()
export class RoosterScheduler implements OnApplicationBootstrap
{
   private readonly logger = new Logger(RoosterScheduler.name);

   constructor(private readonly roosterService: RoosterService,
               private readonly ledenService: LedenService)
   {
      this.logger.log(`RoosterScheduler: actief=${this.isActief()}, cron='${CRON}', tijdzone=${TIMEZONE}, dagen vooruit=${this.dagenVooruit()}, maanden bewaren=${this.maandenBewaren()}`);
   }

   // standaard ook bij opstarten uitvoeren, ROOSTER_RUN_ON_STARTUP=false schakelt dit uit. Er wordt eerst
   // OPSTART_VERTRAGING_MS gewacht, zodat de DienstenScheduler voorloopt met het verwijderen van de oude diensten
   onApplicationBootstrap(): void
   {
      if (this.isActief() && (process.env.ROOSTER_RUN_ON_STARTUP ?? 'true').toLowerCase() !== 'false')
      {
         this.logger.log(`RoosterScheduler: rooster bijwerken bij opstarten over ${OPSTART_VERTRAGING_MS / 1000} seconden`);
         void wacht(OPSTART_VERTRAGING_MS).then(() => this.Uitvoeren());
      }
   }

   @Cron(CRON, {name: 'MaakRooster', timeZone: TIMEZONE})
   async handleCron(): Promise<void>
   {
      if (!this.isActief())
         return;

      this.logger.log('RoosterScheduler: rooster bijwerken cron');
      await this.Uitvoeren();
   }

   // maakt eerst de ontbrekende dagen aan en verwijdert daarna het oude rooster
   async Uitvoeren(): Promise<void>
   {
      try
      {
         const actorId = await this.ledenService.CronjobActorId();
         if (actorId === undefined)
         {
            this.logger.error('RoosterScheduler: geen beheerder gevonden en CRONJOB_ACTOR_ID niet gezet, rooster wordt niet bijgewerkt');
            return;
         }

         await this.MaakRooster(actorId);
         await this.VerwijderRooster(actorId);
      }
      catch (error)
      {
         this.logger.error(`RoosterScheduler: rooster bijwerken mislukt: ${(error as Error)?.message ?? safeStringify(error)}`, (error as Error)?.stack);
      }
   }

   // verwijdert de roosterdagen van meer dan MAANDEN_BEWAREN (default 12) maanden oud permanent uit de database.
   // RemoveObject() vereist dat het record eerst gemarkeerd is als verwijderd, net als via DeleteObject. Lukt het
   // permanent verwijderen niet (bv. omdat er nog diensten naar de roosterdag verwijzen), dan blijft de roosterdag gemarkeerd
   // als verwijderd staan en wordt die bij de volgende run opnieuw permanent verwijderd.
   // Verwijzen er nog diensten naar de roosterdag (foreign key), dan is de DienstenScheduler ingehaald. Er wordt dan gestopt
   // en na HERSTART_VERTRAGING_MS roept VerwijderRooster zichzelf opnieuw aan, maximaal MAX_HERSTARTS keer. De tellers
   // (eerderVerwijderd, eerderMislukt) worden meegegeven, zodat de logging één totaal over alle herstarts geeft
   async VerwijderRooster(actorId: number, herstart = 0, eerderVerwijderd = 0, eerderMislukt = 0): Promise<void>
   {
      // grens in lokale tijd (TIMEZONE), alles vóór deze datum wordt verwijderd
      const grens = DateTime.now().setZone(TIMEZONE).startOf('day').minus({months: this.maandenBewaren()}).toISODate() as string;
      this.logger.log(`RoosterScheduler: start verwijder rooster, roosterdagen voor ${grens}`);

      // ophalen uit de database, zowel actief als verwijderd. De query filtert op DATUM < grens, zodat alleen echt oude roosterdagen worden opgehaald
      const filter = {
         BEGIN_DATUM: lokaleDatum(OUDSTE_DATUM),
         EIND_DATUM: lokaleDatum(addDagen(grens, -1))
      };
      const [actief, verwijderd] = await Promise.all([
         this.roosterService.GetObjects(MaakGetObjectsRequest(GetObjectsOperRoosterRequest, {...filter, VERWIJDERD: false})),
         this.roosterService.GetObjects(MaakGetObjectsRequest(GetObjectsOperRoosterRequest, {...filter, VERWIJDERD: true}))
      ]);

      // combineer de actieve en verwijderde roosterdagen in één lijst, zodat ze in datum volgorde worden verwijderd.
      const kanweg = [
         ...actief.dataset.map((rooster) => ({rooster, eerstVerwijderen: true})),
         ...verwijderd.dataset.map((rooster) => ({rooster, eerstVerwijderen: false}))
      ];

      let verwijderdAantal = eerderVerwijderd;
      let mislukt = eerderMislukt;
      for (const [index, {rooster, eerstVerwijderen}] of kanweg.entries())
      {
         // 1 seconde wachten voordat de volgende dag wordt verwijderd
         if (index > 0)
            await wacht(WACHTTIJD_MS);

         try
         {
            if (eerstVerwijderen)
               await this.roosterService.UpdateObject(rooster.ID, {VERWIJDERD: true}, actorId);

            await this.roosterService.RemoveObject(rooster.ID, actorId);
            verwijderdAantal++;
            this.logger.log(`RoosterScheduler: roosterdag ${rooster.DATUM} verwijderd, ID=${rooster.ID}`);
         }
         catch (error)
         {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === FOREIGN_KEY_FOUT)
            {
               this.logger.warn(`RoosterScheduler: verwijder rooster gestopt bij ${rooster.DATUM} (ID=${rooster.ID}), er zijn nog diensten naar deze roosterdag, ${verwijderdAantal} verwijderd, ${mislukt} mislukt`);

               // maximaal MAX_HERSTARTS herstarten, anders stoppen en bij de volgende cron opnieuw proberen
               if (herstart >= MAX_HERSTARTS)
               {
                  this.logger.warn(`RoosterScheduler: verwijder rooster na ${MAX_HERSTARTS} herstarts gestopt (${verwijderdAantal} verwijderd, ${mislukt} mislukt), wordt bij de volgende cron opnieuw geprobeerd`);
                  return;
               }

               // wachten en opnieuw proberen, de DienstenScheduler heeft dan (hopelijk) de oude diensten verwijderd
               this.logger.warn(`RoosterScheduler: verwijder rooster wordt over ${5 * HERSTART_VERTRAGING_MS / 1000} seconden opnieuw gestart (herstart ${herstart + 1} van ${MAX_HERSTARTS})`);
               await wacht(5 * HERSTART_VERTRAGING_MS);
               return this.VerwijderRooster(actorId, herstart + 1, verwijderdAantal, mislukt);
            }
            mislukt++;
            this.logger.error(`RoosterScheduler: verwijderen roosterdag ${rooster.DATUM} (ID=${rooster.ID}) mislukt: ${(error as Error)?.message ?? safeStringify(error)}`);
         }
      }

      this.logger.log(`RoosterScheduler: verwijder rooster klaar, ${verwijderdAantal} verwijderd, ${mislukt} mislukt, ${herstart} herstarts`);
   }

   // controleert of er voor iedere dag in de periode een rooster bestaat, en maakt de ontbrekende dagen aan
   async MaakRooster(actorId: number): Promise<void>
   {
      // vandaag in lokale tijd (TIMEZONE), luxon houdt rekening met zomer/wintertijd
      const beginDatum = DateTime.now().setZone(TIMEZONE).toISODate() as string;
      const eindDatum = addDagen(beginDatum, this.dagenVooruit());
      this.logger.log(`RoosterScheduler: start maak rooster, periode ${beginDatum} t/m ${eindDatum}`);

      const bestaand = await this.roosterService.GetObjects(MaakGetObjectsRequest(GetObjectsOperRoosterRequest, {
         BEGIN_DATUM: lokaleDatum(beginDatum),
         EIND_DATUM: lokaleDatum(eindDatum),
         VERWIJDERD: false
      }));
      // DATUM is in de GetObjects response al een yyyy-MM-dd string
      const aanwezig = new Set(bestaand.dataset.map((r) => String(r.DATUM)));

      let aangemaakt = 0;
      let mislukt = 0;
      for (let datum = beginDatum; datum <= eindDatum; datum = addDagen(datum, 1))
      {
         // overslaan als de roosterdag al aanwezig is
         if (aanwezig.has(datum))
            continue;

         // 1 seconde wachten voordat de volgende dag wordt aangemaakt
         if (aangemaakt + mislukt > 0)
            await wacht(WACHTTIJD_MS);

         try
         {
            // aanmaken van een nieuwe roosterdag, de default waarden van CLUB_BEDRIJF, DDWV en WINTER_WERK worden bepaald door RoosterService.AddObject()
            const obj = await this.roosterService.AddObject({DATUM: datum} as Prisma.OperRoosterUncheckedCreateInput, actorId);
            aangemaakt++;
            this.logger.log(`RoosterScheduler: roosterdag ${datum} aangemaakt, ${safeStringify({ID: obj.ID, CLUB_BEDRIJF: obj.CLUB_BEDRIJF, DDWV: obj.DDWV, WINTER_WERK: obj.WINTER_WERK})}`);
         }
         catch (error)
         {
            mislukt++;
            this.logger.error(`RoosterScheduler: aanmaken roosterdag ${datum} mislukt: ${(error as Error)?.message ?? safeStringify(error)}`);
         }
      }

      this.logger.log(`RoosterScheduler: maak rooster klaar, ${aanwezig.size} aanwezig, ${aangemaakt} aangemaakt, ${mislukt} mislukt`);
   }

   // scheduler staat standaard aan, ROOSTER_SCHEDULER=false schakelt hem uit (bv. bij meerdere instanties)
   private isActief(): boolean
   {
      return (process.env.ROOSTER_SCHEDULER ?? 'true').toLowerCase() !== 'false';
   }

   private dagenVooruit(): number
   {
      const dagen = Number(process.env.ROOSTER_DAGEN_VOORUIT);
      return Number.isInteger(dagen) && dagen > 0 ? dagen : 730;
   }

   private maandenBewaren(): number
   {
      const maanden = Number(process.env.MAANDEN_BEWAREN);
      return Number.isInteger(maanden) && maanden > 0 ? maanden : 12;
   }
}
