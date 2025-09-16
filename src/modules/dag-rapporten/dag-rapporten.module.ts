import { Module } from '@nestjs/common';
import { DagRapportenService } from './dag-rapporten.service';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {LedenModule} from "../leden/leden.module";
import {DagRapportenController} from "./dag-rapporten.controller";

@Module({
  providers: [DagRapportenService],
  imports: [AuthorisatieModule, HeliosCoreModule, LedenModule],
  controllers: [DagRapportenController]
})
export class DagRapportenModule {}
