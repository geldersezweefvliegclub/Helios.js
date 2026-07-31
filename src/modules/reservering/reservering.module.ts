import {Module} from '@nestjs/common';
import {ReserveringController} from './reservering.controller';
import {ReserveringService} from './reservering.service';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";

@Module({
  imports: [AuthorisatieModule, HeliosCoreModule],
  controllers: [ReserveringController],
  providers: [ReserveringService]
})
export class ReserveringModule {}