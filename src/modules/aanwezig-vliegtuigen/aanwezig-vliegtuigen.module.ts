import { Module } from '@nestjs/common';
import { AanwezigVliegtuigenController } from './aanwezig-vliegtuigen.controller';
import { AanwezigVliegtuigenService } from './aanwezig-vliegtuigen.service';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {LedenModule} from "../leden/leden.module";

@Module({
  imports: [AuthorisatieModule, HeliosCoreModule],
  controllers: [AanwezigVliegtuigenController],
  providers: [AanwezigVliegtuigenService]
})
export class AanwezigVliegtuigenModule {}
