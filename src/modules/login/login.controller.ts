import {Controller, Get, Post, UseGuards} from '@nestjs/common';
import {LoginService} from "./login.service";
import {LocalAuthGuard} from "./guards/local-auth.guard";
import {CurrentUser} from "./current-user.decorator";
import {RefLid} from "@prisma/client";
import {ApiBody, ApiProperty, ApiTags} from "@nestjs/swagger";
import {JwtRefreshAuthGuard} from "./guards/jwt-refresh-auth.guard";
import {LoginResponse, UserInfo} from "./loginDTO";
import {JwtAuthGuard} from "./guards/jwt-auth.guard";

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
   constructor(private readonly loginService: LoginService) {}

   @Post('Login')
   @ApiBody({type: LoginDTO})
   @UseGuards(LocalAuthGuard)    // LocalAuthGuard is a guard that will be used for http requests to authenticate a user.
   async login(@CurrentUser() user: RefLid): Promise<LoginResponse>
   {
      return this.loginService.login(user);
   }


   @Post('refresh')
   @UseGuards(JwtRefreshAuthGuard)
   async refreshToken(@CurrentUser() user: RefLid): Promise<LoginResponse>
   {
      return this.loginService.login(user);
   }

   @Get("GetUserInfo")
   @UseGuards(JwtAuthGuard)
   async getUserInfo(@CurrentUser() user: RefLid): Promise<UserInfo>
   {
      return this.loginService.GetUserInfo(user);
   }
}
