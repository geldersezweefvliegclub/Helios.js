import { Module } from '@nestjs/common';
import { DienstenService } from './diensten.service';
import { DienstenController } from './diensten.controller';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {LedenModule} from "../leden/leden.module";
import {RoosterModule} from "../rooster/rooster.module";

@Module({
  providers: [DienstenService],
  imports: [AuthorisatieModule, HeliosCoreModule, LedenModule, RoosterModule],
  controllers: [DienstenController],
  exports: [DienstenService]
})
export class DienstenModule {}
