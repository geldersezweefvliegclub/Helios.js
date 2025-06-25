import { Module } from '@nestjs/common';
import { AanwezigLedenController } from './aanwezig-leden.controller';
import { AanwezigLedenService } from './aanwezig-leden.service';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {LedenModule} from "../leden/leden.module";

@Module({
  controllers: [AanwezigLedenController],
  imports: [AuthorisatieModule, HeliosCoreModule, LedenModule],
  providers: [AanwezigLedenService]
})
export class AanwezigLedenModule {}
