import { Module } from '@nestjs/common';
import { TypesController } from './types-controller/types.controller';
import { TypesService } from './types-services/types.service';
import {DbService} from "../../database/db-service/db.service";

@Module({
  controllers: [TypesController],
  providers: [
     DbService,
     TypesService]
})
export class TypesModule {}
