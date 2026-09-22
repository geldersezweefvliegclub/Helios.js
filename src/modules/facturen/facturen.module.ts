import { Module } from '@nestjs/common';
import { FacturenService } from './facturen.service';
import { FacturenController } from './facturen.controller';
import {HeliosCoreModule} from "../../core/helios.core.module";
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {LedenModule} from "../leden/leden.module";
import {TypesModule} from "../types/types.module";

@Module({
  providers: [FacturenService],
  imports: [HeliosCoreModule, AuthorisatieModule, LedenModule, TypesModule],
  controllers: [FacturenController]
})
export class FacturenModule {}
