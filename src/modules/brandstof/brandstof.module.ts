import { Module } from '@nestjs/common';
import { BrandstofController } from './brandstof.controller';
import { BrandstofService } from './brandstof.service';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {LedenModule} from "../leden/leden.module";

@Module({
  imports: [AuthorisatieModule, HeliosCoreModule, LedenModule],
  controllers: [BrandstofController],
  providers: [BrandstofService]
})
export class BrandstofModule {}
