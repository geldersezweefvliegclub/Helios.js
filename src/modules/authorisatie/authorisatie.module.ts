import { Module } from '@nestjs/common';
import { PermissieService } from './permissie.service';
import {HeliosCoreModule} from "../../core/helios.core.module";

@Module({
  providers: [PermissieService],
  imports: [HeliosCoreModule ],
  exports: [PermissieService]
})
export class AuthorisatieModule {}
