import { Module } from '@nestjs/common';
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
  imports: [AuthorisatieModule, HeliosCoreModule, LedenModule, StartlijstModule, TypesModule, VliegtuigenModule],
  providers: [AanwezigLedenService],
  exports: [AanwezigLedenService]
})
export class AanwezigLedenModule {}
