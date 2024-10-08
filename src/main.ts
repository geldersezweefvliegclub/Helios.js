import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {INestApplication, Logger, ValidationPipe} from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

function setupSwagger(app: INestApplication, swaggerUrl: string) {
  const swaggerConfig = new DocumentBuilder()
      .setTitle('Helios API')
      .setDescription('De Helios API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(swaggerUrl, app, document);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  setupSwagger(app, 'docs');

  // Enable validation and conversion of incoming data before it reaches the controller
  app.useGlobalPipes(new ValidationPipe({transform: true}));

  await app.listen(3000);
}
bootstrap();
