import {forwardRef, Module} from '@nestjs/common';
import {StartlijstController} from './startlijst.controller';
import {StartlijstService} from './startlijst.service';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {VliegtuigenModule} from "../vliegtuigen/vliegtuigen.module";
import {AanwezigLedenModule} from "../aanwezig-leden/aanwezig-leden.module";
import {AanwezigVliegtuigenModule} from "../aanwezig-vliegtuigen/aanwezig-vliegtuigen.module";
import {LedenModule} from "../leden/leden.module";
import {RoosterModule} from "../rooster/rooster.module";
import {DienstenModule} from "../diensten/diensten.module";

@Module({
  // AanwezigLedenModule en AanwezigVliegtuigenModule importeren op hun beurt StartlijstModule - forwardRef() is
  // hier dus aan beide kanten nodig om deze cirkelverwijzingen op te lossen
  imports: [AuthorisatieModule, HeliosCoreModule, VliegtuigenModule, LedenModule, RoosterModule, DienstenModule,
     forwardRef(() => AanwezigLedenModule), forwardRef(() => AanwezigVliegtuigenModule)],
  controllers: [StartlijstController],
  providers: [StartlijstService],
  exports: [StartlijstService]
})
export class StartlijstModule {}