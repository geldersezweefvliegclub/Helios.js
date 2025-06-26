import { Module } from '@nestjs/common';
import { DienstenService } from './diensten.service';
import { DienstenController } from './diensten.controller';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {LedenModule} from "../leden/leden.module";

@Module({
  providers: [DienstenService],
  imports: [AuthorisatieModule, HeliosCoreModule, LedenModule],
  controllers: [DienstenController]
})
export class DienstenModule {}
