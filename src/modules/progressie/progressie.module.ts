import {Module} from '@nestjs/common';
import {ProgressieController} from './progressie.controller';
import {ProgressieService} from './progressie.service';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {CompetentiesModule} from "../competenties/competenties.module";
import {TypesModule} from "../types/types.module";
import {LedenModule} from "../leden/leden.module";

@Module({
  imports: [AuthorisatieModule, HeliosCoreModule, CompetentiesModule, TypesModule, LedenModule],
  controllers: [ProgressieController],
  providers: [ProgressieService]
})
export class ProgressieModule {}