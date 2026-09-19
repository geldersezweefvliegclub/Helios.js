import {Module} from '@nestjs/common';
import {StartlijstController} from './startlijst.controller';
import {StartlijstService} from './startlijst.service';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {VliegtuigenModule} from "../vliegtuigen/vliegtuigen.module";

@Module({
  imports: [AuthorisatieModule, HeliosCoreModule, VliegtuigenModule],
  controllers: [StartlijstController],
  providers: [StartlijstService],
  exports: [StartlijstService]
})
export class StartlijstModule {}