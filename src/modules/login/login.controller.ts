import {Controller, Get, Logger, Post, UseGuards} from '@nestjs/common';
import {LoginService} from "./login.service";
import {LocalAuthGuard} from "./guards/local-auth.guard";
import {CurrentUser} from "./current-user.decorator";
import {RefLid} from "@prisma/client";
import {ApiBasicAuth, ApiBody, ApiProperty, ApiTags} from "@nestjs/swagger";
import {JwtRefreshAuthGuard} from "./guards/jwt-refresh-auth.guard";
import {LoginResponse, UserInfo} from "./loginDTO";
import {JwtAuthGuard} from "./guards/jwt-auth.guard";
import {AuthGuard} from "@nestjs/passport";
import {safeStringify} from "../../core/helpers/LogHelper";

export class LoginDTO {
   @ApiProperty({
      description: "De inlognaam om systeem te kunnen gebruiken",
      maxLength: 50,
      type: "string",
      nullable: false,
   })
   Inlognaam: string;

   @ApiProperty({
      description: "Het wachtwoord voor deze gebruiker",
      maxLength: 50,
      type: "string",
      nullable: false
   })
   Wachtwoord: string;
}

@Controller('Login')
@ApiTags('Login')
export class LoginController
{
   private readonly logger = new Logger(LoginController.name);

   constructor(private readonly loginService: LoginService) {}

   @Post('Login')
   @ApiBody({type: LoginDTO})
   @UseGuards(LocalAuthGuard)    // LocalAuthGuard is een guard die gebruikt wordt voor http requests om een gebruiker te authenticeren.
   async login(@CurrentUser() currentUser: RefLid): Promise<LoginResponse>
   {
      this.logger.verbose(`LoginController.login(${safeStringify({currentUser})})`);
      return await this.loginService.login(currentUser);
   }

   // TODO: verwijderen. Enkel toegevoegd zodat Login/Login ook via een browser-GET (bijv. adresbalk) te testen is.
   @Get('Login')
   @ApiBasicAuth()
   @UseGuards(AuthGuard('basic-auth'))
   async loginGet(@CurrentUser() currentUser: RefLid): Promise<LoginResponse>
   {
      this.logger.verbose(`LoginController.loginGet(${safeStringify({currentUser})})`);
      return await this.loginService.login(currentUser);
   }


   @Post('refresh')
   @UseGuards(JwtRefreshAuthGuard)
   async refreshToken(@CurrentUser() currentUser: RefLid): Promise<LoginResponse>
   {
      this.logger.verbose(`LoginController.refreshToken(${safeStringify({currentUser})})`);
      return await this.loginService.login(currentUser);
   }

   @Get("GetUserInfo")
   @UseGuards(JwtAuthGuard)
   async getUserInfo(@CurrentUser() currentUser: RefLid): Promise<UserInfo>
   {
      this.logger.verbose(`LoginController.getUserInfo(${safeStringify({currentUser})})`);
      return await this.loginService.GetUserInfo(currentUser);
   }
}
