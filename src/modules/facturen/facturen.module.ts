import { Module } from '@nestjs/common';
import { FacturenService } from './facturen.service';
import { FacturenController } from './facturen.controller';

@Module({
  providers: [FacturenService],
  controllers: [FacturenController]
})
export class FacturenModule {}
