import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '../token-payload.interface';
import { Injectable } from '@nestjs/common';
import {LedenService} from "../../leden/leden.service";


// The cookie name is 'Authentication' and the token is stored in it
// load Lid and make it available for all http requests
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy)
{
  constructor(private readonly configService: ConfigService,
              private readonly ledenService: LedenService)
  {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request.cookies?.Authentication,
      ]),
      secretOrKey: configService.getOrThrow('JWT.JWT_ACCESS_TOKEN_SECRET'),
    });
  }

  async validate(payload: TokenPayload) {
    return this.ledenService.GetObject(parseInt(payload.LidID));
  }
}
