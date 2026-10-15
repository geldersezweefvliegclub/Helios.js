import {forwardRef, Module} from '@nestjs/common';
import {DiscoveryModule} from '@nestjs/core';
import { PermissieService } from './permissie.service';
import { PermissieController } from './permissie.controller';
import {HeliosCoreModule} from "../../core/helios.core.module";
import {TypesModule} from "../types/types.module";

@Module({
  // TypesModule importeert op zijn beurt AuthorisatieModule (voor heeftToegang) - forwardRef() lost deze
  // cirkelverwijzing op. DiscoveryModule is nodig om alle endpoints van de applicatie te vinden (GetEndpoints)
  imports: [HeliosCoreModule, DiscoveryModule, forwardRef(() => TypesModule)],
  controllers: [PermissieController],
  providers: [PermissieService],
  exports: [PermissieService]
})
export class AuthorisatieModule {}
