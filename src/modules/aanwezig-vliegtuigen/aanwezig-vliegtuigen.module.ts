import { Module } from '@nestjs/common';
import { AanwezigVliegtuigenController } from './aanwezig-vliegtuigen.controller';
import { AanwezigVliegtuigenService } from './aanwezig-vliegtuigen.service';

@Module({
  controllers: [AanwezigVliegtuigenController],
  providers: [AanwezigVliegtuigenService]
})
export class AanwezigVliegtuigenModule {}
