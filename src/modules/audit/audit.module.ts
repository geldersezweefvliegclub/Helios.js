import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import {HeliosCoreModule} from "../../core/helios.core.module";
import {LedenModule} from "../leden/leden.module";

@Module({
  controllers: [AuditController],
  imports: [HeliosCoreModule, LedenModule],
  providers: [AuditService]
})
export class AuditModule {}
