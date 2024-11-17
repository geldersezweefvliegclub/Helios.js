import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import {LoginService} from "../login.service";


@Injectable()
// Strategy is a passport-local strategy that will be used to authenticate a user.
export class LocalStrategy extends PassportStrategy(Strategy) {
   constructor(private readonly loginervice: LoginService) {
      super({
         // incoming request will have a field called inlognaam to authenticate the user.
         usernameField: 'Inlognaam',
         passwordField: 'Wachtwoord',
      });
   }

   // validate() method will be called by the passport library to validate the user.
   async validate(inlognaam: string, wachtwoord: string) {
      // the return value (lid) will be available in the request user object.
      return this.loginervice.verifyUser(inlognaam, wachtwoord);
   }
}
