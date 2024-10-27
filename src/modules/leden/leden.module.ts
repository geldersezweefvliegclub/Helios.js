import { Module } from '@nestjs/common';
import { LedenController } from './leden.controller';
import { LedenService } from './leden.service';
import {HeliosCoreModule} from "../../core/helios.core.module";

@Module({
  imports: [HeliosCoreModule],
  controllers: [LedenController],
  providers: [LedenService]
})
export class LedenModule {}
