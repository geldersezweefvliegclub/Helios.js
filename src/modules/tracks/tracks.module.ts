import {Module} from '@nestjs/common';
import {TracksController} from './tracks.controller';
import {TracksService} from './tracks.service';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";

@Module({
  imports: [AuthorisatieModule, HeliosCoreModule],
  controllers: [TracksController],
  providers: [TracksService]
})
export class TracksModule {}