import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {BadRequestException, INestApplication, ValidationPipe} from "@nestjs/common";
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import {utilities, WinstonModule} from 'nest-winston';
import * as winston from 'winston';
import * as cookieParser from 'cookie-parser';
import {BadRequestExceptionFilter, HeliosHttpExceptionFilter} from "./core/helpers/HeliosHttpExceptionFilter";
import { dump }             from 'js-yaml';
import {HeliosPrismaClientKnownRequestError} from "./core/helpers/HeliosPrismaClientKnownRequestError";
import {HeliosPrismaClientDefaultError} from "./core/helpers/HeliosPrismaClientDefaultError";
import {HeliosPrismaClientValidationError} from "./core/helpers/HeliosPrismaClientValidationError";

/**
 * Create a logger for the application using Winston instead of the built-in nestjs logger.
 * Allows for logging to multiple transports, such as the console and Seq, or modifying the log format.
 */
const createLogger = async () => {
   const transports: winston.transport[] = [
      new winston.transports.Console({
         format: winston.format.combine(
             winston.format.timestamp(),
             winston.format.ms(),
             utilities.format.nestLike('Helios API', {
                colors: true,
                prettyPrint: true,
                appName: true,
             }),
          ),
      }),
   ];

   // @datalust/winston-seq is ESM-only, dynamic import so it's never require()'d when the Seq server isn't configured
   if (process.env.LOGGER_SERVER_URL)
   {
      const {SeqTransport} = await import("@datalust/winston-seq");
      transports.push(new SeqTransport({
         serverUrl: process.env.LOGGER_SERVER_URL,
         apiKey: process.env.LOGGER_API_KEY,
         onError: ((e: Error) => {
            console.error(e);
         }),
         handleExceptions: true,
         handleRejections: true,
      }));
   }

   return WinstonModule.createLogger({
      level: process.env.LOGGER_LEVEL || 'info',
      format: winston.format.combine(   /* This is required to get errors to log with stack traces. See https://github.com/winstonjs/winston/issues/1498 */
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

   // Convert JSON spec to YAML
   const yamlSpec = dump(document);

   // swager file is downloadable via <<base_url>>/swagger.yaml
   app.getHttpAdapter().get('/swagger.yaml', (_req, res) => {
      res.type('application/x-yaml').send(yamlSpec);
   });
}

async function bootstrap()
{
   const app = await NestFactory.create(AppModule, {
     logger: await createLogger()  // the logger to record debug information
   });
    app.enableCors({
        credentials: true,
        origin: "http://localhost:4200"
    });

   setupSwagger(app, 'docs');

   // Enable validation and conversion of incoming data before it reaches the controller
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

   // Prisma client Exception filters
   app.useGlobalFilters(new HeliosPrismaClientDefaultError());
   app.useGlobalFilters(new HeliosPrismaClientValidationError());
   app.useGlobalFilters(new HeliosPrismaClientKnownRequestError());

   app.use(cookieParser()); // Allow the application to read cookies and add them to the request object
   await app.listen(3000);
}

bootstrap();
