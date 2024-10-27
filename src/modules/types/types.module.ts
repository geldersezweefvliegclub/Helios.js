import {Module} from '@nestjs/common';
import {TypesController} from './types-controller/types.controller';
import {TypesService} from './types-services/types.service';
import {HeliosCoreModule} from "../../core/helios.core.module";

@Module({
  controllers: [TypesController],
  imports: [HeliosCoreModule],
  providers: [TypesService]
})
export class TypesModule {}
