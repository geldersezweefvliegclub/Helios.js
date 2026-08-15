import {Module} from '@nestjs/common';
import {StartlijstController} from './startlijst.controller';
import {StartlijstService} from './startlijst.service';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";

@Module({
  imports: [AuthorisatieModule, HeliosCoreModule],
  controllers: [StartlijstController],
  providers: [StartlijstService]
})
export class StartlijstModule {}