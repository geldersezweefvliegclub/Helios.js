import {Injectable, Logger, OnModuleDestroy} from '@nestjs/common';
import {connectAsync, MqttClient} from "mqtt";

interface MqttSettings
{
   host: string;
   port: number;
   clientId: string;
   username?: string;
   password?: string;
}

// generieke MQTT publish-service, analoog aan postMqttMessage() in include/helios.php: elk bericht krijgt
// dezelfde envelope {type, table, data, timestamp}. Anders dan de PHP versie (die per bericht
// verbindt/publiceert/ontkoppelt, passend bij een per-request scriptmodel) wordt hier een enkele verbinding
// lui opgezet en hergebruikt over de levensduur van het NestJS process.
// De instellingen komen uit de omgeving (.env, zie .env-template). Zonder MQTT_HOST staat MQTT uit
@Injectable()
export class MqttService implements OnModuleDestroy
{
   private readonly logger = new Logger(MqttService.name);
   private readonly instellingen = MqttService.leesInstellingen();
   private client: MqttClient | undefined;
   private verbindingPromise: Promise<MqttClient> | undefined;

   constructor()
   {
      if (this.instellingen)
         this.logger.log(`MQTT broker ${this.instellingen.host}:${this.instellingen.port} (client ${this.instellingen.clientId}, ` +
            `${this.instellingen.username ? 'gebruiker ' + this.instellingen.username : 'anoniem'})`);
      else
         this.logger.warn(`MQTT staat uit: MQTT_HOST is niet gezet in de omgeving (.env)`);
   }

   // is MQTT_HOST gezet? Zo niet, dan publiceert de event listener niets (net als PHP zonder $mqtt_settings)
   isGeconfigureerd(): boolean
   {
      return this.instellingen !== undefined;
   }

   // publiceert op topic "gezc/<queue>", zoals postMqttMessage() in de PHP versie
   async publish(queue: string, type: string, table: string, data: unknown): Promise<void>
   {
      await this.publishOpTopic(`gezc/${queue}`, type, table, data);
   }

   // publiceert op een volledig opgegeven topic (bijv. "helios/events"), met dezelfde envelope
   async publishOpTopic(topic: string, type: string, table: string, data: unknown): Promise<void>
   {
      this.logger.verbose(`MqttService.publishOpTopic(${JSON.stringify({topic, type, table})})`);
      const client = await this.haalClientOp();
      const bericht = JSON.stringify({
         type: type,
         table: table,
         data: data,
         timestamp: new Date().toISOString()
      });
      await client.publishAsync(topic, bericht, {qos: 0});
      this.logger.verbose(`MqttService.publishOpTopic() => verstuurd op ${topic}`);
   }

   async onModuleDestroy(): Promise<void>
   {
      await this.client?.endAsync();
   }

   // maakt (indien nog niet aanwezig) een MQTT verbinding en cachet deze voor hergebruik. Bij een mislukte
   // verbindingspoging wordt de cache leeggemaakt zodat een volgende publish() opnieuw kan proberen
   private async haalClientOp(): Promise<MqttClient>
   {
      if (this.client)
         return this.client;

      if (!this.verbindingPromise)
      {
         this.verbindingPromise = this.maakVerbinding().catch((err) =>
         {
            this.verbindingPromise = undefined;
            throw err;
         });
      }

      this.client = await this.verbindingPromise;
      return this.client;
   }

   private async maakVerbinding(): Promise<MqttClient>
   {
      if (!this.instellingen)
         throw new Error(`MQTT is niet geconfigureerd (MQTT_HOST ontbreekt in .env)`);

      // zonder gebruikersnaam verbinden we anoniem, ook als er wel een wachtwoord is ingevuld
      const {host, port, clientId, username, password} = this.instellingen;
      const client = await connectAsync(`mqtt://${host}:${port}`,
         username ? {clientId, username, password} : {clientId});
      client.on('error', (err) => this.logger.error(`MqttService verbindingsfout: ${err.message}`));
      return client;
   }

   // MQTT_HOST verplicht, de rest optioneel: MQTT_PORT (1883), MQTT_CLIENT_ID (helios-js), MQTT_USERNAME, MQTT_PASSWORD.
   // Zonder MQTT_USERNAME wordt anoniem verbonden en MQTT_PASSWORD genegeerd
   private static leesInstellingen(): MqttSettings | undefined
   {
      const host = process.env.MQTT_HOST?.trim();
      if (!host)
         return undefined;

      return {
         host: host,
         port: Number(process.env.MQTT_PORT?.trim() || 1883),
         clientId: process.env.MQTT_CLIENT_ID?.trim() || 'helios-js',
         username: process.env.MQTT_USERNAME?.trim() || undefined,
         password: process.env.MQTT_PASSWORD || undefined,
      };
   }
}
