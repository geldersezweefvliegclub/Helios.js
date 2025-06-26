import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import {HeliosCoreModule} from "../../core/helios.core.module";
import {LedenModule} from "../leden/leden.module";
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";

@Module({
  controllers: [AuditController],
  imports: [AuthorisatieModule, HeliosCoreModule, LedenModule],
  providers: [AuditService]
})
export class AuditModule {}
