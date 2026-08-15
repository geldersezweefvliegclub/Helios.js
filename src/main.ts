import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {BadRequestException, INestApplication, ValidationPipe} from "@nestjs/common";
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import {WinstonModule} from 'nest-winston';
import * as winston from 'winston';
import * as fs from 'fs';
import * as cookieParser from 'cookie-parser';
import {BadRequestExceptionFilter, HeliosHttpExceptionFilter} from "./core/helpers/HeliosHttpExceptionFilter";
import { dump }             from 'js-yaml';
import {HeliosPrismaClientKnownRequestError} from "./core/helpers/HeliosPrismaClientKnownRequestError";
import {HeliosPrismaClientDefaultError} from "./core/helpers/HeliosPrismaClientDefaultError";
import {HeliosPrismaClientValidationError} from "./core/helpers/HeliosPrismaClientValidationError";

// Lokale tijd van de dag met milliseconden, geen datum - bijv. "14:23:05.123".
const localTimeWithMs = (): string => {
   const now = new Date();
   const pad = (n: number, len = 2) => String(n).padStart(len, '0');
   return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`;
};

// IGNORE_LOGGING="Class.method, Class, Other.method" - onderdrukt de entry/exit logregels voor deze entries,
// op elke transport. "Class.method" matcht enkel die functie; "Class" (zonder punt) matcht elke functie
// van die class. Gematcht als prefix - "Class.method(" of "Class." - aangezien onze logging conventie altijd
// logt als "Class.method(args)" bij binnenkomst en "Class.method() => result" bij het verlaten, beide beginnend op die manier.
// Dit filter is enkel van toepassing op debug/verbose entries - error/warn/info/silly worden altijd gelogd.
const ignoredLogPrefixes = (process.env.IGNORE_LOGGING || '')
   .split(',')
   .map(entry => entry.trim())
   .filter(Boolean)
   .map(entry => entry.includes('.') ? `${entry}(` : `${entry}.`);

const ignoreExcludedFunctions = winston.format((info) => {
   const isFilterableLevel = info.level === 'debug' || info.level === 'verbose';
   if (ignoredLogPrefixes.length === 0 || !isFilterableLevel || typeof info.message !== 'string')
   {
      return info;
   }
   return ignoredLogPrefixes.some(prefix => (info.message as string).startsWith(prefix)) ? false : info;
});

/**
 * Maakt een logger voor de applicatie met Winston in plaats van de ingebouwde nestjs logger.
 * Maakt het mogelijk om naar meerdere transports te loggen, zoals de console en Seq, of het logformaat aan te passen.
 */
const createLogger = async () => {
   const transports: winston.transport[] = [
      new winston.transports.Console({
         level: 'info',
         format: winston.format.combine(
             ignoreExcludedFunctions(),
             winston.format.colorize({
                all: true,
             }),
             winston.format.simple(),
         ),
      }),
   ];

   // Loggen naar een bestand is opt-in: als LOGGER_FILE_DIR niet is ingesteld, wordt file logging volledig overgeslagen.
   // Als de directory nog niet bestaat, wordt deze aangemaakt.
   const logFileDir = process.env.LOGGER_FILE_DIR;
   if (logFileDir)
   {
      try
      {
         fs.mkdirSync(logFileDir, {recursive: true});
         transports.push(new winston.transports.File({
            level: process.env.LOGGER_FILE_LEVEL || process.env.LOGGER_LEVEL || 'info',
            dirname: logFileDir,
            filename: 'helios-api.log',
            // Het bestand heeft enkel "<lokale tijd met ms>;<message>" nodig, niet de level/JSON metadata die elders gebruikt wordt.
            format: winston.format.combine(
               ignoreExcludedFunctions(),
               winston.format.printf(info => `${localTimeWithMs()};${info.message}`),
            ),
            maxsize: 10 * 1024 * 1024,   // 10 MB per bestand
            maxFiles: 2,                 // actief bestand + 1 gerotate backup - nooit meer dan 2 bestanden in de directory
            tailable: true,              // houdt het actieve bestand altijd helios-api.log genoemd; bij rotatie wordt het
                                          // helios-api1.log, waarbij een eventuele vorige backup wordt overschreven (niet aangevuld)
         }));
      }
      catch (e)
      {
         console.error(`Kon logdirectory ${logFileDir} niet gebruiken, file logging wordt overgeslagen: ${e.message}`);
      }
   }

   // @datalust/winston-seq is ESM-only, dynamic import zodat het nooit ge-require()'d wordt als de Seq server niet geconfigureerd is
   if (process.env.LOGGER_SERVER_URL)
   {
      const {SeqTransport} = await import("@datalust/winston-seq");
      transports.push(new SeqTransport({
         serverUrl: process.env.LOGGER_SERVER_URL,
         apiKey: process.env.LOGGER_API_KEY,
         format: winston.format.combine(
            ignoreExcludedFunctions(),
            winston.format.errors({stack: true}),
            winston.format.json(),
         ),
         onError: ((e: Error) => {
            console.error(e);
         }),
         handleExceptions: true,
         handleRejections: true,
      }));
   }

   return WinstonModule.createLogger({
      level: process.env.LOGGER_LEVEL || 'info',
      format: winston.format.combine(   /* Dit is nodig om errors met stack traces te loggen. Zie https://github.com/winstonjs/winston/issues/1498 */
         winston.format.errors({stack: true}),
         winston.format.json(),
      ),
      defaultMeta: {
         Application: 'Helios API',
         Instance: process.env.INSTANCE || 'Local',
         Environment: process.env.NODE_ENV || 'Local',
      },
      transports,
   });
};

function setupSwagger(app: INestApplication, swaggerUrl: string)
{
   const swaggerConfig = new DocumentBuilder()
      .setTitle('Helios API')
      .setDescription('De Helios API')
      .setVersion('1.0')
      .addBasicAuth()
      .build();

   const document = SwaggerModule.createDocument(app, swaggerConfig);
   SwaggerModule.setup(swaggerUrl, app, document, {
      swaggerOptions: {
         tagsSorter: 'alpha',
         operationsSorter: 'alpha',
      },
   });

   // Zet JSON spec om naar YAML
   const yamlSpec = dump(document);

   // swagger bestand is downloadbaar via <<base_url>>/swagger.yaml
   app.getHttpAdapter().get('/swagger.yaml', (_req, res) => {
      res.type('application/x-yaml').send(yamlSpec);
   });
}

async function bootstrap()
{
   const logger = await createLogger();

   // Vangnet: zonder dit stopt Node.js het hele proces bij een onverwachte fout (bv. een aanroep
   // die faalt zonder dat er ergens een .catch op zit). Dit voorkomt dat de hele applicatie
   // onderuitgaat door één enkele, geïsoleerde fout.
   process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled promise rejection', reason instanceof Error ? reason.stack : String(reason));
   });

   process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception', err.stack);
   });

   const app = await NestFactory.create(AppModule, {
     logger  // de logger om debug informatie vast te leggen
   });
    app.enableCors({
        credentials: true,
        origin: "http://localhost:4200"
    });

   setupSwagger(app, 'docs');

   // Schakelt validatie en conversie van binnenkomende data in voordat deze de controller bereikt
   app.useGlobalPipes(new ValidationPipe(
      {
         transform: true,
         whitelist: true,
         forbidNonWhitelisted: true,

         exceptionFactory: (errors) => {
            const msg = errors[0].constraints[Object.keys(errors[0].constraints)[0]]
            return new BadRequestException(msg);
         },
      }));
   // HTTP Exception filters
   app.useGlobalFilters(new HeliosHttpExceptionFilter())
   app.useGlobalFilters(new BadRequestExceptionFilter());

   // Prisma client exception filters
   app.useGlobalFilters(new HeliosPrismaClientDefaultError());
   app.useGlobalFilters(new HeliosPrismaClientValidationError());
   app.useGlobalFilters(new HeliosPrismaClientKnownRequestError());

   app.use(cookieParser()); // Zorgt dat de applicatie cookies kan lezen en toevoegen aan het request object
   await app.listen(3000);
}

bootstrap();
