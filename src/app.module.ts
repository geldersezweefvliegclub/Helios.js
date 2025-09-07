import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {TypesGroepenModule} from './modules/types-groepen/types-groepen.module';
import {EventEmitterModule} from '@nestjs/event-emitter';
import {HeliosController} from './core/controllers/helios/helios.controller';
import {TypesModule} from './modules/types/types.module';
import {AuditModule} from './modules/audit/audit.module';
import {HeliosCoreModule} from './core/helios.core.module';
import {LedenModule} from './modules/leden/leden.module';
import {LoginModule} from './modules/login/login.module';
import {AuthorisatieModule} from './modules/authorisatie/authorisatie.module';
import {BrandstofModule} from './modules/brandstof/brandstof.module';
import {VliegtuigenModule} from './modules/vliegtuigen/vliegtuigen.module';
import {CompetentiesModule} from './modules/competenties/competenties.module';
import {AgendaModule} from './modules/agenda/agenda.module';
import {JournaalModule} from './modules/journaal/journaal.module';
import {DocumentenModule} from './modules/documenten/documenten.module';
import {WinterwerkModule} from './modules/winterwerk/winterwerk.module';
import {DagInfoModule} from './modules/dag-info/dag-info.module';
import {DagRapportenModule} from './modules/dag-rapporten/dag-rapporten.module';
import {GastenModule} from './modules/gasten/gasten.module';
import {TransactiesModule} from './modules/transacties/transacties.module';
import {AanwezigLedenModule} from './modules/aanwezig-leden/aanwezig-leden.module';
import {AanwezigVliegtuigenModule} from './modules/aanwezig-vliegtuigen/aanwezig-vliegtuigen.module';
import {RoosterModule} from './modules/rooster/rooster.module';
import {DienstenModule} from './modules/diensten/diensten.module';
import {FacturenModule} from './modules/facturen/facturen.module';
import { DdwvModule } from './modules/ddwv/ddwv.module';
import config from './config/configuration';


@Module({
   imports: [
      ConfigModule.forRoot({                 // Moet als eerste staan
         isGlobal: true,
         load: [config]
      }),
      EventEmitterModule.forRoot(),
      ConfigModule,
      HeliosCoreModule,
      TypesGroepenModule,
      TypesModule,
      AuditModule,
      LedenModule,
      LoginModule,
      AuthorisatieModule,
      BrandstofModule,
      VliegtuigenModule,
      CompetentiesModule,
      AgendaModule,
      JournaalModule,
      DocumentenModule,
      WinterwerkModule,
      DagInfoModule,
      DagRapportenModule,
      GastenModule,
      TransactiesModule,
      AanwezigLedenModule,
      AanwezigVliegtuigenModule,
      RoosterModule,
      DienstenModule,
      FacturenModule,
      DdwvModule,
   ],
   controllers: [HeliosController],
   providers: [],
})
export class AppModule
{
}
