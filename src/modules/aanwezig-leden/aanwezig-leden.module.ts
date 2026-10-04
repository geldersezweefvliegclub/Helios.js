import {forwardRef, Module} from '@nestjs/common';
import { AanwezigLedenController } from './aanwezig-leden.controller';
import { AanwezigLedenService } from './aanwezig-leden.service';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {LedenModule} from "../leden/leden.module";
import {StartlijstModule} from "../startlijst/startlijst.module";
import {TypesModule} from "../types/types.module";
import {VliegtuigenModule} from "../vliegtuigen/vliegtuigen.module";

@Module({
  controllers: [AanwezigLedenController],
  // StartlijstModule importeert op zijn beurt AanwezigLedenModule (aanmelden van vlieger en inzittende na het
  // opslaan van een start) - forwardRef() is hier dus aan beide kanten nodig om deze cirkelverwijzing op te lossen
  imports: [AuthorisatieModule, HeliosCoreModule, LedenModule, forwardRef(() => StartlijstModule), TypesModule, VliegtuigenModule],
  providers: [AanwezigLedenService],
  exports: [AanwezigLedenService]
})
export class AanwezigLedenModule {}
