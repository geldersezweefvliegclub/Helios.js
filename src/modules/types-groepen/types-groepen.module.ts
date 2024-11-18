import {Module} from '@nestjs/common';
import {TypesGroepenController} from './types-groepen.controller';
import {TypesGroepenService} from './types-groepen.service';
import {HeliosCoreModule} from "../../core/helios.core.module";
import {LedenModule} from "../leden/leden.module";
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";

@Module({
   controllers: [TypesGroepenController],
   imports: [AuthorisatieModule, HeliosCoreModule, LedenModule],
   providers: [TypesGroepenService]
})
export class TypesGroepenModule
{
}
