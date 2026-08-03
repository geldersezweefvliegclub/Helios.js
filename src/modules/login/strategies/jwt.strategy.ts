import {ConfigService} from '@nestjs/config';
import {PassportStrategy} from '@nestjs/passport';
import {ExtractJwt, Strategy} from 'passport-jwt';
import {TokenPayload} from '../token-payload.interface';
import {Injectable} from '@nestjs/common';
import {LedenService} from "../../leden/leden.service";


// De cookie naam is 'Authentication' en de token wordt hierin opgeslagen
// laad Lid en maak het beschikbaar voor alle http requests
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy)
{
  constructor(configService: ConfigService, private readonly ledenService: LedenService)
  {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow('JWT.JWT_ACCESS_TOKEN_SECRET'),
    });

  }

  async validate(payload: TokenPayload) {
    return this.ledenService.GetObject(parseInt(payload.LidID));
  }
}
