import { Module} from '@nestjs/common';
import { LedenController } from './leden.controller';
import { LedenService } from './leden.service';
import {HeliosCoreModule} from "../../core/helios.core.module";
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";

@Module({
  imports: [AuthorisatieModule, HeliosCoreModule],
  controllers: [LedenController],
  providers: [LedenService],
  exports: [LedenService],
})
export class LedenModule {}
