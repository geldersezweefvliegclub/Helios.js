import {forwardRef, Module} from '@nestjs/common';
import {AanwezigVliegtuigenController} from './aanwezig-vliegtuigen.controller';
import {AanwezigVliegtuigenService} from './aanwezig-vliegtuigen.service';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {StartlijstModule} from "../startlijst/startlijst.module";

@Module({
  // StartlijstModule importeert op zijn beurt AanwezigVliegtuigenModule (aanmelden van het vliegtuig na het
  // opslaan van een start) - forwardRef() is hier dus aan beide kanten nodig om deze cirkelverwijzing op te lossen
  imports: [AuthorisatieModule, HeliosCoreModule, forwardRef(() => StartlijstModule)],
  controllers: [AanwezigVliegtuigenController],
  providers: [AanwezigVliegtuigenService],
  exports: [AanwezigVliegtuigenService]
})
export class AanwezigVliegtuigenModule {}
