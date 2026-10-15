import {forwardRef, Module} from '@nestjs/common';
import {TypesController} from './types.controller';
import {TypesService} from './types.service';
import {HeliosCoreModule} from "../../core/helios.core.module";
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";

@Module({
  controllers: [TypesController],
  // AuthorisatieModule importeert op zijn beurt TypesModule (validatie ROL_ID) - forwardRef() lost deze cirkelverwijzing op
  imports: [forwardRef(() => AuthorisatieModule), HeliosCoreModule],
  providers: [TypesService],
  exports: [TypesService]
})
export class TypesModule {}
