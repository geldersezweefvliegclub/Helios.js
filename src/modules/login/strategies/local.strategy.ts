import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import {LoginService} from "../login.service";


@Injectable()
// Strategy is een passport-local strategy die gebruikt wordt om een gebruiker te authenticeren.
export class LocalStrategy extends PassportStrategy(Strategy) {
   constructor(private readonly loginervice: LoginService) {
      super({
         // het inkomende request heeft een veld genaamd inlognaam om de gebruiker te authenticeren.
         usernameField: 'Inlognaam',
         passwordField: 'Wachtwoord',
      });
   }

   // de validate() methode wordt door de passport library aangeroepen om de gebruiker te valideren.
   async validate(inlognaam: string, wachtwoord: string) {
      // de returnwaarde (lid) komt beschikbaar in het request user object.
      return this.loginervice.verifyUser(inlognaam, wachtwoord);
   }
}
