import {Module} from '@nestjs/common';
import {TypesGroepenController} from './types-groepen-controller/types-groepen.controller';
import {TypesGroepenService} from './types-groepen-services/types-groepen.service';
import {DbService} from "../../database/db-service/db.service";
import {HeliosCoreModule} from "../../core/helios.core.module";

@Module({
   controllers: [TypesGroepenController],
   imports: [HeliosCoreModule],
   providers: [TypesGroepenService]
})
export class TypesGroepenModule
{
}
