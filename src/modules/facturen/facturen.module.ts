import { Module } from '@nestjs/common';
import { FacturenService } from './facturen.service';
import { FacturenController } from './facturen.controller';
import {HeliosCoreModule} from "../../core/helios.core.module";
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";

@Module({
  providers: [FacturenService],
  imports: [HeliosCoreModule, AuthorisatieModule],
  controllers: [FacturenController]
})
export class FacturenModule {}
