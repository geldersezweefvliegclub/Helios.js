import { Module } from '@nestjs/common';
import { WinterwerkController } from './winterwerk.controller';
import { WinterwerkService } from './winterwerk.service';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {LedenModule} from "../leden/leden.module";

@Module({
  controllers: [WinterwerkController],
  imports: [AuthorisatieModule, HeliosCoreModule, LedenModule],
  providers: [WinterwerkService]
})
export class WinterwerkModule {}
