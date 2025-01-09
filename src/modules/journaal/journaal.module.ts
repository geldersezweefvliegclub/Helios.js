import { Module } from '@nestjs/common';
import { JournaalController } from './journaal.controller';
import { JournaalService } from './journaal.service';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";

@Module({
  imports: [AuthorisatieModule, HeliosCoreModule],
  controllers: [JournaalController],
  providers: [JournaalService]
})
export class JournaalModule {}
