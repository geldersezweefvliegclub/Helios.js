import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {ConfigModule} from '@nestjs/config';
import {TypesGroepenModule} from './modules/types-groepen/types-groepen.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import {DbService} from './database/db-service/db.service';
import { HeliosController } from './core/controllers/helios/helios.controller';
import { TypesModule } from './modules/types/types.module';
import { AuditModule } from './modules/audit/audit.module';
import config from './config/configuration';


@Module({
   imports: [
      ConfigModule.forRoot({                 // Moet als eerste staan
         isGlobal: true,
         load: [config]
      }),
      EventEmitterModule.forRoot(),
      ConfigModule,
      TypesGroepenModule,
      TypesModule,
      AuditModule,
   ],
   controllers: [AppController, HeliosController],
   providers: [AppService, DbService],
})
export class AppModule
{
}
