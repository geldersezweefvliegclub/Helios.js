import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import {HeliosCoreModule} from "../../core/helios.core.module";

@Module({
  controllers: [AuditController],
  imports: [HeliosCoreModule],
  providers: [AuditService]
})
export class AuditModule {}
