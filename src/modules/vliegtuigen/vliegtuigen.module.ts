import { Module } from '@nestjs/common';
import { VliegtuigenService } from './vliegtuigen.service';
import { VliegtuigenController } from './vliegtuigen.controller';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";

@Module({
  imports: [AuthorisatieModule, HeliosCoreModule],
  providers: [VliegtuigenService],
  controllers: [VliegtuigenController]
})
export class VliegtuigenModule {}
