import {MqttEventsListener, MQTT_EVENTS_QUEUE} from './mqtt-events.listener';
import {MqttService} from './mqtt.service';

describe('MqttEventsListener', () =>
{
   let gepubliceerd: {queue: string, type: string, table: string, data: Record<string, unknown>}[];
   let listener: MqttEventsListener;

   beforeEach(() =>
   {
      gepubliceerd = [];
      const mqttService = {
         isGeconfigureerd: () => true,
         publish: async (queue: string, type: string, table: string, data: Record<string, unknown>) =>
         {
            gepubliceerd.push({queue, type, table, data});
         }
      } as unknown as MqttService;
      listener = new MqttEventsListener(mqttService);
   });

   it('publiceert toevoegen op gezc/helios met de tabelnaam', () =>
   {
      listener.CreatedRecord('AgendaService', 7, {KORT: 'x'}, {ID: 7, KORT: 'x', VERWIJDERD: false}, 1);

      expect(gepubliceerd).toHaveLength(1);
      expect(gepubliceerd[0].queue).toBe(MQTT_EVENTS_QUEUE);
      expect(MQTT_EVENTS_QUEUE).toBe('helios');
      expect(gepubliceerd[0].type).toBe('toevoegen');
      expect(gepubliceerd[0].table).toBe('oper_agenda');
      expect(gepubliceerd[0].data).toEqual({
         voor: null, data: {KORT: 'x'}, resultaat: [{ID: 7, KORT: 'x', VERWIJDERD: false}], record_id: 7
      });
   });

   it('publiceert aanpassen met voor, data en resultaat', () =>
   {
      listener.UpdatedRecord('TypesService', 3, {ID: 3, OMSCHRIJVING: 'a', VERWIJDERD: false},
         {OMSCHRIJVING: 'b'}, {ID: 3, OMSCHRIJVING: 'b', VERWIJDERD: false}, 1);

      expect(gepubliceerd[0].type).toBe('aanpassen');
      expect(gepubliceerd[0].table).toBe('ref_types');
      expect(gepubliceerd[0].data.voor).toEqual([{ID: 3, OMSCHRIJVING: 'a', VERWIJDERD: false}]);
      expect(gepubliceerd[0].data.data).toEqual({OMSCHRIJVING: 'b'});
   });

   it('maakt van VERWIJDERD false -> true een verwijderd bericht, en true -> false een herstel bericht', () =>
   {
      listener.UpdatedRecord('AgendaService', 5, {ID: 5, VERWIJDERD: false}, {VERWIJDERD: true}, {ID: 5, VERWIJDERD: true}, 1);
      listener.UpdatedRecord('AgendaService', 5, {ID: 5, VERWIJDERD: true}, {VERWIJDERD: false}, {ID: 5, VERWIJDERD: false}, 1);

      expect(gepubliceerd.map(b => b.type)).toEqual(['verwijderd', 'herstel']);
      expect(gepubliceerd[0].data).toEqual({voor: [{ID: 5, VERWIJDERD: false}], data: null, resultaat: null, record_id: 5});
      expect(gepubliceerd[1].data).toEqual({voor: null, data: null, resultaat: [{ID: 5, VERWIJDERD: false}], record_id: 5});
   });

   it('publiceert permanent verwijderen als elimineer', () =>
   {
      listener.RemovedRecord('StartlijstService', 9, {ID: 9, VERWIJDERD: true}, 1);

      expect(gepubliceerd[0].type).toBe('elimineer');
      expect(gepubliceerd[0].table).toBe('oper_startlijst');
      expect(gepubliceerd[0].data).toEqual({voor: [{ID: 9, VERWIJDERD: true}], data: null, resultaat: null, record_id: 9});
   });

   it('zet wachtwoord, secret en tokens nooit op de bus', () =>
   {
      const lid = {ID: 1, NAAM: 'Jan', WACHTWOORD: '$2y$hash', SECRET: 'ABC123', VERWIJDERD: false};
      listener.UpdatedRecord('LedenService', 1, lid, {WACHTWOORD: 'nieuw', NAAM: 'Jan'}, lid, 1);

      const tekst = JSON.stringify(gepubliceerd[0].data);
      expect(tekst).not.toContain('$2y$hash');
      expect(tekst).not.toContain('ABC123');
      expect(tekst).not.toContain('nieuw');
      expect(gepubliceerd[0].data.voor).toEqual([{ID: 1, NAAM: 'Jan', WACHTWOORD: null, SECRET: null, VERWIJDERD: false}]);
   });

   it('laat Date en andere objecten heel', () =>
   {
      const datum = new Date('2026-11-13T10:00:00Z');
      listener.CreatedRecord('AgendaService', 2, {DATUM: datum}, {ID: 2, DATUM: datum}, 1);

      expect((gepubliceerd[0].data.data as {DATUM: Date}).DATUM).toBe(datum);
   });

   it('gebruikt de klassenaam als er geen tabel bekend is', () =>
   {
      listener.CreatedRecord('OnbekendService', 1, {}, {ID: 1}, 1);
      expect(gepubliceerd[0].table).toBe('OnbekendService');
   });

   it('laat een mislukte publicatie de actie niet laten falen', async () =>
   {
      const falend = new MqttEventsListener({
         isGeconfigureerd: () => true,
         publish: async () => { throw new Error('geen verbinding'); }
      } as unknown as MqttService);

      expect(() => falend.CreatedRecord('AgendaService', 1, {}, {ID: 1}, 1)).not.toThrow();
      await new Promise((klaar) => setImmediate(klaar));     // de catch in de listener moet de fout afvangen
   });

   it('publiceert niets als MQTT uit staat (geen MQTT_HOST)', () =>
   {
      let aangeroepen = false;
      const uit = new MqttEventsListener({
         isGeconfigureerd: () => false,
         publish: async () => { aangeroepen = true; }
      } as unknown as MqttService);

      uit.CreatedRecord('AgendaService', 1, {}, {ID: 1}, 1);
      expect(aangeroepen).toBe(false);
   });
});
