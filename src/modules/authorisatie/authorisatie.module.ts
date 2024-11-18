import { Module } from '@nestjs/common';
import { PermissieService } from './permissie.service';
import {HeliosCoreModule} from "../../core/helios.core.module";
import {LedenModule} from "../leden/leden.module";

@Module({
  providers: [PermissieService],
  imports: [HeliosCoreModule, LedenModule],
  exports: [PermissieService]
})
export class AuthorisatieModule {}
