import {Injectable, Logger} from '@nestjs/common';
import {OnEvent} from '@nestjs/event-emitter';
import {MqttService} from './mqtt.service';
import {DatabaseEvents} from '../helpers/Events';

// queue waarop alle database wijzigingen gepubliceerd worden: topic gezc/helios, zoals in de PHP versie
export const MQTT_EVENTS_QUEUE = 'helios';

// De services geven bij een event hun klassenaam mee. Externe afnemers kennen (net als in de PHP versie) de
// database tabelnaam, zie @@map in prisma/schema. Een service die hier ontbreekt wordt met zijn klassenaam gepubliceerd
const TABEL_PER_SERVICE: Record<string, string> = {
   AanwezigLedenService: 'oper_aanwezig_leden',
   AanwezigVliegtuigenService: 'oper_aanwezig_vliegtuigen',
   AgendaService: 'oper_agenda',
   BrandstofService: 'oper_brandstof',
   CompetentiesService: 'ref_competenties',
   DagInfoService: 'oper_daginfo',
   DagRapportenService: 'oper_dagrapporten',
   DienstenService: 'oper_diensten',
   DocumentenService: 'documenten',
   FacturenService: 'oper_facturen',
   JournaalService: 'oper_journaal',
   LedenService: 'ref_leden',
   PermissieService: 'ref_permissie',
   ProgressieService: 'oper_progressie',
   ReserveringService: 'oper_reservering',
   RoosterService: 'oper_rooster',
   StartlijstService: 'oper_startlijst',
   TracksService: 'oper_tracks',
   TransactiesService: 'oper_transacties',
   TypesGroepenService: 'ref_types_groepen',
   TypesService: 'ref_types',
   VliegtuigenService: 'ref_vliegtuigen',
   WinterwerkService: 'oper_winterwerk',
};

// velden die nooit op de bus mogen: wachtwoord hashes, 2FA secrets en tokens. Iedere subscriber kan meelezen
const GEHEIME_VELDEN = ['WACHTWOORD', 'SECRET', 'REFRESH_TOKEN', 'INGEVOERD_WACHTWOORD'];

// het bericht in data, gelijk aan postMqttMessage() in include/helios.php
interface MqttEventData
{
   voor: unknown[] | null;
   data: unknown;
   resultaat: unknown[] | null;
   record_id: number;
}

// Publiceert iedere database wijziging op de MQTT bus, zoals de PHP versie dat in de gedeelde basisklasse deed.
// Luistert naar dezelfde events als de audit trail. Types zoals in PHP:
//   toevoegen  - AddObject
//   aanpassen  - UpdateObject
//   verwijderd - UpdateObject waarbij VERWIJDERD van false naar true gaat (DeleteObject, soft delete)
//   herstel    - UpdateObject waarbij VERWIJDERD van true naar false gaat (RestoreObject)
//   elimineer  - RemoveObject (permanent verwijderen)
// Een mislukte publicatie wordt gelogd maar laat de database actie nooit falen. Instellingen: MQTT_* in .env
@Injectable()
export class MqttEventsListener
{
   private readonly logger = new Logger(MqttEventsListener.name);

   constructor(private readonly mqttService: MqttService)
   {
   }

   @OnEvent(DatabaseEvents.Created)
   CreatedRecord(objNaam: string, id: number, data: unknown, result: unknown, _actorId: number): void
   {
      this.publiceer('toevoegen', objNaam, {voor: null, data: data, resultaat: [result], record_id: id});
   }

   @OnEvent(DatabaseEvents.Updated)
   UpdatedRecord(objNaam: string, id: number, before: unknown, data: unknown, result: unknown, _actorId: number): void
   {
      const wasVerwijderd = this.isVerwijderd(before);
      const isVerwijderd = this.isVerwijderd(result);

      if (!wasVerwijderd && isVerwijderd)
         this.publiceer('verwijderd', objNaam, {voor: [before], data: null, resultaat: null, record_id: id});
      else if (wasVerwijderd && !isVerwijderd)
         this.publiceer('herstel', objNaam, {voor: null, data: null, resultaat: [result], record_id: id});
      else
         this.publiceer('aanpassen', objNaam, {voor: [before], data: data, resultaat: [result], record_id: id});
   }

   @OnEvent(DatabaseEvents.Removed)
   RemovedRecord(objNaam: string, id: number, data: unknown, _actorId: number): void
   {
      this.publiceer('elimineer', objNaam, {voor: [data], data: null, resultaat: null, record_id: id});
   }

   // stuurt het bericht zonder te wachten (event listener), fouten worden alleen gelogd.
   // Staat MQTT uit (geen MQTT_HOST), dan gebeurt er niets, net als PHP zonder $mqtt_settings
   private publiceer(type: string, objNaam: string, bericht: MqttEventData): void
   {
      if (!this.mqttService.isGeconfigureerd())
         return;

      const tabel = TABEL_PER_SERVICE[objNaam] ?? objNaam;
      this.mqttService.publish(MQTT_EVENTS_QUEUE, type, tabel, this.zonderGeheimen(bericht))
         .catch((err) =>
         {
            const foutmelding = err instanceof Error ? err.message : String(err);
            this.logger.error(`MQTT event ${type} ${tabel} (ID=${bericht.record_id}) niet gepubliceerd: ${foutmelding}`);
         });
   }

   private isVerwijderd(record: unknown): boolean
   {
      return (record as {VERWIJDERD?: boolean} | null)?.VERWIJDERD === true;
   }

   // maakt een kopie waarin de geheime velden op elk niveau op null staan. Date en Decimal blijven heel,
   // JSON.stringify zet die later om
   private zonderGeheimen<T>(waarde: T): T
   {
      if (Array.isArray(waarde))
         return waarde.map((w) => this.zonderGeheimen(w)) as T;

      if (waarde === null || typeof waarde !== 'object' || waarde.constructor !== Object)
         return waarde;

      const kopie: Record<string, unknown> = {};
      for (const [veld, inhoud] of Object.entries(waarde))
         kopie[veld] = GEHEIME_VELDEN.includes(veld) ? null : this.zonderGeheimen(inhoud);
      return kopie as T;
   }
}
