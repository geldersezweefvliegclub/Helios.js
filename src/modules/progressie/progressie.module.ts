import {forwardRef, Module} from '@nestjs/common';
import {ProgressieController} from './progressie.controller';
import {ProgressieService} from './progressie.service';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {CompetentiesModule} from "../competenties/competenties.module";
import {TypesModule} from "../types/types.module";
import {LedenModule} from "../leden/leden.module";

@Module({
  // LedenModule importeert op zijn beurt ProgressieModule (voor de PAX bevoegdheid check in
  // LedenService) - forwardRef() is hier dus aan beide kanten nodig om deze cirkelverwijzing op te lossen
  imports: [AuthorisatieModule, HeliosCoreModule, CompetentiesModule, TypesModule, forwardRef(() => LedenModule)],
  controllers: [ProgressieController],
  providers: [ProgressieService],
  exports: [ProgressieService]
})
export class ProgressieModule {}