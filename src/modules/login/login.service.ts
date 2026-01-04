import {Injectable, UnauthorizedException} from '@nestjs/common';
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

@Injectable()
export class LoginService
{
   constructor(private readonly dbService: DbService,
               private readonly ledenService: LedenService,
               private readonly aanwezigLedenService: AanwezigLedenService,
               private readonly permissieService: PermissieService,
               private readonly configService: ConfigService,
               private readonly jwtService: JwtService) {

   }

   async login(lid: RefLid): Promise<LoginResponse> {
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


      return {
         Refresh: {
            AccessToken: refreshToken,
            ExpiresInMs: expiresRefreshTokenMs,
         },
         Authentication: {
            AccessToken: accessToken,
            ExpiresInMs: expiresAccessTokenMs,
         }
      }
   }

   async verifyUser(inlognaam: string, wachtwoord: string): Promise<RefLid> {
      const lid = await this.ledenService.GetObjectByInlognaam(inlognaam);
      // todo: check password with current implementation

      const authenticated = (this.configService.get("DEMO_MODE") === true) ? true : await compare(wachtwoord, lid.WACHTWOORD);
      if (!authenticated) {
         throw new UnauthorizedException('Credentials are not valid.');
      }
      return lid; // return the user object for upcomming actions
   }

   async veryifyUserRefreshToken(refreshToken: string, userId: number) {
      const token = await this.getRefreshToken(userId);
      const authenticated = await compare(refreshToken, token.REFRESH_TOKEN);
      if (!authenticated) {
         throw new UnauthorizedException('Refresh token is not valid.');
      }
      return await this.ledenService.GetObject(userId);
   }

   // Get the refresh token from the database
   async getRefreshToken(lidID: number): Promise<AuthUserDto > {
      return await this.dbService.authUser.findUnique({
         where: {
            LID_ID: lidID
         }
      });
   }
   // Save the refresh token in the database, in a separate table
   async storeRefreshToken(lidID: number, refreshToken: string) {
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
        return {
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
        }
    }
}

