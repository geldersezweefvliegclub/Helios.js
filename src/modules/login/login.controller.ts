import {Controller, Post, Res, UseGuards} from '@nestjs/common';
import {LoginService} from "./login.service";
import {LocalAuthGuard} from "./guards/local-auth.guard";
import {CurrentUser} from "./current-user.decorator";
import {RefLid} from "@prisma/client";
import { Response } from 'express';
import {ApiExtraModels, ApiProperty} from "@nestjs/swagger";
import {JwtRefreshAuthGuard} from "./guards/jwt-refresh-auth.guard";

export class Ilogin {
   @ApiProperty({
      description: "inlognaam",
      maxLength: 50,
      type: "string",
      nullable: false,
   })
   inlognaam: string;
   wachtwoord: string;
}

@Controller('Login')
export class LoginController
{
   constructor(private readonly loginService: LoginService) {}

   @Post('login')
   @ApiExtraModels(Ilogin)
   @UseGuards(LocalAuthGuard)    // LocalAuthGuard is a guard that will be used for http requests to authenticate a user.
   async login(
      @CurrentUser() user: RefLid,
      @Res({ passthrough: true }) response: Response)
   {
      await this.loginService.login(user, response);
   }


   @Post('refresh')
   @UseGuards(JwtRefreshAuthGuard)
   async refreshToken(
      @CurrentUser() user: RefLid,
      @Res({passthrough: true}) response: Response,
   )
   {
      await this.loginService.login(user, response);
   }
}
