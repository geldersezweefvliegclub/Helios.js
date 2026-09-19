import { Module } from '@nestjs/common';
import { DagRapportenService } from './dag-rapporten.service';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {LedenModule} from "../leden/leden.module";
import {DagRapportenController} from "./dag-rapporten.controller";
import {RoosterModule} from "../rooster/rooster.module";
import {DienstenModule} from "../diensten/diensten.module";

@Module({
  providers: [DagRapportenService],
  imports: [AuthorisatieModule, HeliosCoreModule, LedenModule, RoosterModule, DienstenModule],
  controllers: [DagRapportenController]
})
export class DagRapportenModule {}
