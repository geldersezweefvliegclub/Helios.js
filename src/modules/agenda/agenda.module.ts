import { Module } from '@nestjs/common';
import { AgendaController } from './agenda.controller';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {AgendaService} from "./agenda.service";
import {LedenModule} from "../leden/leden.module";

@Module({
  imports: [AuthorisatieModule, HeliosCoreModule, LedenModule],
  controllers: [AgendaController],
  providers: [AgendaService]
})
export class AgendaModule {}
