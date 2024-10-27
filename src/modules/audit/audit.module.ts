import { Module } from '@nestjs/common';
import { AuditController } from './audit-controller/audit.controller';
import { AuditService } from './audit-services/audit.service';
import {HeliosCoreModule} from "../../core/helios.core.module";

@Module({
  controllers: [AuditController],
  imports: [HeliosCoreModule],
  providers: [AuditService]
})
export class AuditModule {}
