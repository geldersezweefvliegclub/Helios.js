import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {BadRequestException, INestApplication, ValidationPipe} from "@nestjs/common";
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import {WinstonModule} from 'nest-winston';
import * as winston from 'winston';
import {SeqTransport} from "@datalust/winston-seq";
import {BadRequestExceptionFilter, HeliosHttpExceptionFilter} from "./core/helpers/HeliosException";

/**
 * Create a logger for the application using Winston instead of the built-in nestjs logger.
 * Allows for logging to multiple transports, such as the console and Seq, or modifying the log format.
 */
const createLogger = () => WinstonModule.createLogger({
   level: 'debug',
   format: winston.format.combine(   /* This is required to get errors to log with stack traces. See https://github.com/winstonjs/winston/issues/1498 */
      winston.format.errors({stack: true}),
      winston.format.json(),
   ),
   defaultMeta: {
      Application: 'Helios API',
      Instance: process.env.INSTANCE || 'Local',
      Environment: process.env.NODE_ENV || 'Local',
   },
   transports: [
      // log everything to the console
      new winston.transports.Console({
         format: winston.format.combine(
            winston.format.colorize({
               all: true,
            }),
            winston.format.simple(),
         ),
      }),
      new SeqTransport({
         serverUrl: process.env.LOGGER_SERVER_URL || 'http://localhost:5341',
         apiKey: process.env.LOGGER_API_KEY,
         onError: (e =>
         {
            console.error(e);
         }),
         handleExceptions: true,
         handleRejections: true,
      }),
   ],
});


function setupSwagger(app: INestApplication, swaggerUrl: string)
{
   const swaggerConfig = new DocumentBuilder()
      .setTitle('Helios API')
      .setDescription('De Helios API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

   const document = SwaggerModule.createDocument(app, swaggerConfig);
   SwaggerModule.setup(swaggerUrl, app, document);
}

async function bootstrap()
{
   const app = await NestFactory.create(AppModule, {
      logger: createLogger()  // the logger to record debug information
   });
   app.enableCors();

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
   app.useGlobalFilters(new HeliosHttpExceptionFilter(), new BadRequestExceptionFilter());

   await app.listen(3000);
}

bootstrap();
