import {Module} from '@nestjs/common';
import {RoosterController} from './rooster.controller';
import {RoosterService} from './rooster.service';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {DdwvModule} from "../ddwv/ddwv.module";

@Module({
  imports: [AuthorisatieModule, HeliosCoreModule, DdwvModule],
  controllers: [RoosterController],
  providers: [RoosterService],
  exports: [RoosterService]
})
export class RoosterModule {}
