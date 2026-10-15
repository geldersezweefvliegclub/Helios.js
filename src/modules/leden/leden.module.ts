import { forwardRef, Module} from '@nestjs/common';
import { LedenController } from './leden.controller';
import { LedenService } from './leden.service';
import {HeliosCoreModule} from "../../core/helios.core.module";
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {ProgressieModule} from "../progressie/progressie.module";
import {TypesModule} from "../types/types.module";

@Module({
  // ProgressieModule importeert op zijn beurt LedenModule - forwardRef() lost deze cirkelverwijzing op,
  // zie de toelichting in progressie.module.ts
  imports: [AuthorisatieModule, HeliosCoreModule, TypesModule, forwardRef(() => ProgressieModule)],
  controllers: [LedenController],
  providers: [LedenService],
  exports: [LedenService],
})
export class LedenModule {}
