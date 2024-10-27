import { Module } from '@nestjs/common';
import { AuditController } from './audit-controller/audit.controller';
import { AuditService } from './audit-services/audit.service';
import {DbService} from "../../database/db-service/db.service";

@Module({
  controllers: [AuditController],
  providers: [DbService,AuditService]
})
export class AuditModule {}
