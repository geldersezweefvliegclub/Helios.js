import {Injectable, Logger, OnModuleDestroy} from '@nestjs/common';
import {ConfigService} from "@nestjs/config";
import {connectAsync, MqttClient} from "mqtt";

interface MqttSettings
{
   host: string;
   port: number;
   clientId: string;
   username: string;
   password: string;
}

// generieke MQTT publish-service, analoog aan postMqttMessage() in include/helios.php: elk bericht krijgt
// dezelfde envelope {type, table, data, timestamp} en wordt gepubliceerd op topic "gezc/<queue>". Anders dan
// de PHP versie (die per bericht verbindt/publiceert/ontkoppelt, passend bij een per-request scriptmodel)
// wordt hier een enkele verbinding lui opgezet en hergebruikt over de levensduur van het NestJS process
@Injectable()
export class MqttService implements OnModuleDestroy
{
   private readonly logger = new Logger(MqttService.name);
   private client: MqttClient | undefined;
   private verbindingPromise: Promise<MqttClient> | undefined;

   constructor(private readonly configService: ConfigService)
   {
   }

   async publish(queue: string, type: string, table: string, data: unknown): Promise<void>
   {
      this.logger.verbose(`MqttService.publish(${JSON.stringify({queue, type, table})})`);
      const client = await this.haalClientOp();
      const bericht = JSON.stringify({
         type: type,
         table: table,
         data: data,
         timestamp: new Date().toISOString()
      });
      await client.publishAsync(`gezc/${queue}`, bericht, {qos: 0});
      this.logger.verbose(`MqttService.publish() => verstuurd op gezc/${queue}`);
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
      const instellingen = this.configService.get<MqttSettings>('mqtt_settings');
      if (!instellingen)
         throw new Error(`mqtt_settings ontbreekt in de configuratie`);

      const client = await connectAsync(`mqtt://${instellingen.host}:${instellingen.port}`, {
         clientId: instellingen.clientId,
         username: instellingen.username,
         password: instellingen.password,
      });
      client.on('error', (err) => this.logger.error(`MqttService verbindingsfout: ${err.message}`));
      return client;
   }
}
