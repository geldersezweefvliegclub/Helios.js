import { Module } from '@nestjs/common';
import { DocumentenService } from './documenten.service';
import { DocumentenController } from './documenten.controller';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {LedenModule} from "../leden/leden.module";

@Module({
  imports: [AuthorisatieModule, HeliosCoreModule, LedenModule],
  providers: [DocumentenService],
  controllers: [DocumentenController]
})
export class DocumentenModule {}
