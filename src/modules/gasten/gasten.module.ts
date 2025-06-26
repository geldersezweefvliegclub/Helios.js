import { Module } from '@nestjs/common';
import { GastenController } from './gasten.controller';
import { GastenService } from './gasten.service';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {LedenModule} from "../leden/leden.module";

@Module({
  controllers: [GastenController],
  imports: [AuthorisatieModule, HeliosCoreModule],
  providers: [GastenService]
})
export class GastenModule {}
