import { BasicStrategy as Strategy } from 'passport-http';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {LoginService} from "../login.service";
import {LoginController} from "../login.controller";

@Injectable()
export class BasicStrategy extends PassportStrategy(Strategy, 'basic-auth') {
   constructor(private readonly loginService: LoginService,
               private readonly loginController : LoginController)
   {
      super({
         passReqToCallback: true
      });
   }

   public validate = async (req, inlognaam, wachtwoord)=> {
      const lid = await this.loginService.verifyUser(inlognaam, wachtwoord);  // verify user credentials
      await this.loginController.login(lid, req.res);  // set JWT token as cookie for subsequent requests
      return lid;
   }
}