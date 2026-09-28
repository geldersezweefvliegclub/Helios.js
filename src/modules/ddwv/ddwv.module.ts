import {Module} from '@nestjs/common';
import { DdwvController } from './ddwv.controller';
import { DdwvService } from './ddwv.service';

@Module({
  controllers: [DdwvController],
  providers: [DdwvService],
  exports: [DdwvService]
})
export class DdwvModule {}
