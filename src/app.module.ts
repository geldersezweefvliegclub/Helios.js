import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypesGroepenModule } from './modules/types-groepen/types-groepen.module';
import { DbService } from './database/db-service/db.service';
import config from './config/configuration';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config]
    }),
    ConfigModule,
    TypesGroepenModule,
  ],
  controllers: [AppController],
  providers: [AppService, DbService],
})
export class AppModule {}
