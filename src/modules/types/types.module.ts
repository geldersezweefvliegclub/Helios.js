import {Module} from '@nestjs/common';
import {TypesController} from './types.controller';
import {TypesService} from './types.service';
import {HeliosCoreModule} from "../../core/helios.core.module";
import {LedenModule} from "../leden/leden.module";
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";

@Module({
  controllers: [TypesController],
  imports: [AuthorisatieModule, HeliosCoreModule, LedenModule],
  providers: [TypesService],
  exports: [TypesService]
})
export class TypesModule {}
