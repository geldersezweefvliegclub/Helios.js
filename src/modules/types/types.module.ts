import {Module} from '@nestjs/common';
import {TypesController} from './types.controller';
import {TypesService} from './types.service';
import {HeliosCoreModule} from "../../core/helios.core.module";
import {LedenModule} from "../leden/leden.module";

@Module({
  controllers: [TypesController],
  imports: [HeliosCoreModule, LedenModule],
  providers: [TypesService]
})
export class TypesModule {}
