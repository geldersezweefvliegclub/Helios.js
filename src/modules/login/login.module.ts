import { Module } from '@nestjs/common';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';
import {LedenModule} from "../leden/leden.module";
import {LocalStrategy} from "./strategies/local.strategy";
import {PassportModule} from "@nestjs/passport";
import {JwtModule} from "@nestjs/jwt";
import {JwtStrategy} from "./strategies/jwt.strategy";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {JwtRefreshStrategy} from "./strategies/jwt-refresh.strategy";
import {BasicStrategy} from "./strategies/auth-basic.strategy";

@Module({
  imports: [HeliosCoreModule, LedenModule, PassportModule, JwtModule],
  controllers: [LoginController],
  providers: [LoginService, LoginController, LocalStrategy, JwtStrategy, JwtRefreshStrategy, BasicStrategy]
})
export class LoginModule {}
