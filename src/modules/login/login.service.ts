import {Injectable, Logger, UnauthorizedException} from '@nestjs/common';
import {LedenService} from "../leden/leden.service";
import {ConfigService} from "@nestjs/config";
import {JwtService} from '@nestjs/jwt';
import {RefLid} from "@prisma/client";
import {compare, hash} from "bcryptjs";
import {TokenPayload} from "./token-payload.interface";
import {DbService} from "../../database/db-service/db.service";
import {AuthUserDto} from "../../generated/nestjs-dto/authUser.dto";
import {LoginResponse, UserInfo} from "./loginDTO";
import {PermissieService} from "../authorisatie/permissie.service";
import {AanwezigLedenService} from "../aanwezig-leden/aanwezig-leden.service";
import {safeStringify} from "../../core/helpers/LogHelper";

@Injectable()
export class LoginService
{
   private readonly logger = new Logger(LoginService.name);

   constructor(private readonly dbService: DbService,
               private readonly ledenService: LedenService,
               private readonly aanwezigLedenService: AanwezigLedenService,
               private readonly permissieService: PermissieService,
               private readonly configService: ConfigService,
               private readonly jwtService: JwtService) {

   }

   async login(lid: RefLid): Promise<LoginResponse> {
      this.logger.verbose(`LoginService.login(${safeStringify({lid})})`);
      const expiresAccessTokenMs =  parseInt(this.configService.getOrThrow<string>('JWT.JWT_ACCESS_TOKEN_EXPIRATION_MS'));
      const expiresRefreshTokenMs = parseInt(this.configService.getOrThrow<string>('JWT.JWT_REFRESH_TOKEN_EXPIRATION_MS'));

      const tokenPayload: TokenPayload = {
         LidID: lid.ID.toString(),
      };

      const accessToken = this.jwtService.sign(tokenPayload, {
         secret: this.configService.getOrThrow('JWT.JWT_ACCESS_TOKEN_SECRET'),
         expiresIn: `${expiresAccessTokenMs}ms`,
      });
      const refreshToken = this.jwtService.sign(tokenPayload, {
         secret: this.configService.getOrThrow('JWT.JWT_REFRESH_TOKEN_SECRET'),
         expiresIn: `${expiresRefreshTokenMs}ms`,
      });

      await this.storeRefreshToken(lid.ID, await hash(refreshToken, 10));


      const result = {
         Refresh: {
            AccessToken: refreshToken,
            ExpiresInMs: expiresRefreshTokenMs,
         },
         Authentication: {
            AccessToken: accessToken,
            ExpiresInMs: expiresAccessTokenMs,
         }
      };
      this.logger.verbose(`LoginService.login() => ${safeStringify(result)}`);
      return result;
   }

   async verifyUser(inlognaam: string, wachtwoord: string): Promise<RefLid> {
      this.logger.verbose(`LoginService.verifyUser(${safeStringify({inlognaam, wachtwoord})})`);
      const lid = await this.ledenService.GetObjectByInlognaam(inlognaam);
      // todo: wachtwoord controleren met huidige implementatie

      const authenticated = (this.configService.get("DEMO_MODE") === true) ? true : await compare(wachtwoord, lid.WACHTWOORD);
      if (!authenticated) {
         throw new UnauthorizedException('Credentials are not valid.');
      }
      this.logger.verbose(`LoginService.verifyUser() => ${safeStringify(lid)}`);
      return lid; // geeft het user object terug voor volgende acties
   }

   async veryifyUserRefreshToken(refreshToken: string, userId: number) {
      this.logger.verbose(`LoginService.veryifyUserRefreshToken(${safeStringify({refreshToken, userId})})`);
      const token = await this.getRefreshToken(userId);
      const authenticated = await compare(refreshToken, token.REFRESH_TOKEN);
      if (!authenticated) {
         throw new UnauthorizedException('Refresh token is not valid.');
      }
      const result = await this.ledenService.GetObject(userId);
      this.logger.verbose(`LoginService.veryifyUserRefreshToken() => ${safeStringify(result)}`);
      return result;
   }

   // Haal de refresh token op uit de database
   async getRefreshToken(lidID: number): Promise<AuthUserDto > {
      this.logger.verbose(`LoginService.getRefreshToken(${safeStringify({lidID})})`);
      const result = await this.dbService.authUser.findUnique({
         where: {
            LID_ID: lidID
         }
      });
      this.logger.verbose(`LoginService.getRefreshToken() => ${safeStringify(result)}`);
      return result;
   }
   // Sla de refresh token op in de database, in een aparte tabel
   async storeRefreshToken(lidID: number, refreshToken: string) {
      this.logger.verbose(`LoginService.storeRefreshToken(${safeStringify({lidID, refreshToken})})`);
      const record= await this.getRefreshToken(lidID);

      if (record) {
         await this.dbService.authUser.update({
            where: {
               ID: record.ID
            },
            data: {
               REFRESH_TOKEN: refreshToken
            }
         });
      }
      else {
         await this.dbService.authUser.create({
            data: {
               LID_ID: lidID,
               REFRESH_TOKEN: refreshToken
            }
         });
      }
   }

    async GetUserInfo(currentUser: RefLid): Promise<UserInfo> {
        this.logger.verbose(`LoginService.GetUserInfo(${safeStringify({currentUser})})`);
        const result = {
            Userinfo: {
                isAangemeld: await this.aanwezigLedenService.IsAangemeld(currentUser),
                isBeheerder: this.permissieService.isBeheerder(currentUser),
                isBeheerderDDWV: this.permissieService.isBeheerderDDWV(currentUser),
                isCIMT: this.permissieService.isCIMT(currentUser),
                isClubVlieger: this.permissieService.isLid(currentUser),
                isDDWV: this.permissieService.isDDWVer(currentUser),
                isRooster: this.permissieService.isRooster(currentUser),
                isInstructeur: this.permissieService.isInstructeur(currentUser),
                isStarttoren: this.permissieService.isStarttoren(currentUser),
                isRapporteur: this.permissieService.isRapporteur(currentUser),
                isDDWVCrew: this.permissieService.isDDWVCrew(currentUser)
            },
            LidData: currentUser
        };
        this.logger.verbose(`LoginService.GetUserInfo() => ${safeStringify(result)}`);
        return result;
    }
}

