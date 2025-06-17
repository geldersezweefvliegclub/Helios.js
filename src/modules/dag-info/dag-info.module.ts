import { Module } from '@nestjs/common';
import { DagInfoController } from './dag-info.controller';
import { DagInfoService } from './dag-info.service';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {LedenModule} from "../leden/leden.module";

@Module({
  controllers: [DagInfoController],
  imports: [AuthorisatieModule, HeliosCoreModule, LedenModule],
  providers: [DagInfoService]
})
export class DagInfoModule {}
