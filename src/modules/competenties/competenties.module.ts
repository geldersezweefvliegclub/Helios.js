import { Module } from '@nestjs/common';
import { CompetentiesController } from './competenties.controller';
import { CompetentiesService } from './competenties.service';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {TypesModule} from "../types/types.module";
import {TypesService} from "../types/types.service";

@Module({
  imports: [AuthorisatieModule, HeliosCoreModule, TypesModule],
  controllers: [CompetentiesController],
  providers: [CompetentiesService]
})
export class CompetentiesModule {}
