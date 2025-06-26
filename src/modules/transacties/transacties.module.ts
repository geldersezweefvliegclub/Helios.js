import { Module } from '@nestjs/common';
import { TransactiesService } from './transacties.service';
import { TransactiesController } from './transacties.controller';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {LedenModule} from "../leden/leden.module";

@Module({
  providers: [TransactiesService],
  imports: [AuthorisatieModule, HeliosCoreModule, LedenModule],
  controllers: [TransactiesController]
})
export class TransactiesModule {}
