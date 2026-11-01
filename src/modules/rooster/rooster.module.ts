import {Module} from '@nestjs/common';
import {RoosterController} from './rooster.controller';
import {RoosterService} from './rooster.service';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {LedenModule} from "../leden/leden.module";
import {RoosterScheduler} from "./rooster.scheduler";

@Module({
  imports: [AuthorisatieModule, HeliosCoreModule, LedenModule],
  controllers: [RoosterController],
  providers: [RoosterService, RoosterScheduler],
  exports: [RoosterService]
})
export class RoosterModule {}
