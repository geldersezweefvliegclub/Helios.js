import { Module } from '@nestjs/common';
import { RoosterController } from './rooster.controller';
import { RoosterService } from './rooster.service';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {LedenModule} from "../leden/leden.module";

@Module({
  imports: [AuthorisatieModule, HeliosCoreModule],
  controllers: [RoosterController],
  providers: [RoosterService]
})
export class RoosterModule {}
