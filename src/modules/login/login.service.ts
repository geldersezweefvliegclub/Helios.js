import {Injectable, UnauthorizedException} from '@nestjs/common';
import {LedenService} from "../leden/leden.service";
import {ConfigService} from "@nestjs/config";
import { JwtService } from '@nestjs/jwt';
import {RefLid} from "@prisma/client";
import {compare, hash} from "bcryptjs";
import {logger} from "@brakebein/prisma-generator-nestjs-dto/dist/utils";
import {TokenPayload} from "./token-payload.interface";
import { Response } from 'express';
import {DbService} from "../../database/db-service/db.service";
import {AuthUserDto} from "../../generated/nestjs-dto/authUser.dto";

@Injectable()
export class LoginService
{
   constructor(private readonly dbService: DbService,
               private readonly ledenService: LedenService,
               private readonly configService: ConfigService,
               private readonly jwtService: JwtService)  {}

   async login(lid: RefLid, response: Response, redirect = false) {

      const expiresAccessToken = new Date();
      expiresAccessToken.setMilliseconds(
         expiresAccessToken.getTime() +
         parseInt(
            this.configService.getOrThrow<string>(
               'JWT.JWT_ACCESS_TOKEN_EXPIRATION_MS',
            ),
         ),
      );

      const expiresRefreshToken = new Date();
      expiresRefreshToken.setMilliseconds(
         expiresRefreshToken.getTime() +
         parseInt(
            this.configService.getOrThrow<string>(
               'JWT.JWT_REFRESH_TOKEN_EXPIRATION_MS',
            ),
         ),
      );

      const tokenPayload: TokenPayload = {
         LidID: lid.ID.toString(),
      };
      const accessToken = this.jwtService.sign(tokenPayload, {
         secret: this.configService.getOrThrow('JWT.JWT_ACCESS_TOKEN_SECRET'),
         expiresIn: `${this.configService.getOrThrow(
            'JWT.JWT_ACCESS_TOKEN_EXPIRATION_MS',
         )}ms`,
      });
      const refreshToken = this.  jwtService.sign(tokenPayload, {
         secret: this.configService.getOrThrow('JWT.JWT_REFRESH_TOKEN_SECRET'),
         expiresIn: `${this.configService.getOrThrow(
            'JWT.JWT_REFRESH_TOKEN_EXPIRATION_MS',
         )}ms`,
      });

      await this.storeRefreshToken(lid.ID, await hash(refreshToken, 10));

      response.cookie('Authentication', accessToken, {
         httpOnly: true,
         secure: this.configService.get('NODE_ENV') === 'production',
         expires: expiresAccessToken,
      });
      response.cookie('Refresh', refreshToken, {
         httpOnly: true,
         secure: this.configService.get('NODE_ENV') === 'production',
         expires: expiresRefreshToken,
      });

      if (redirect) {
         response.redirect(this.configService.getOrThrow('AUTH_UI_REDIRECT'));
      }
   }

   async verifyUser(inlognaam: string, wachtwoord: string): Promise<RefLid> {
      try {
         const lid = await this.ledenService.GetObjectByInlognaam(inlognaam);
         // todo: check password with current implementation

         const authenticated = true; // await compare(password, lid.WACHTWOORD);
         if (!authenticated) {
            throw new UnauthorizedException();
         }
         return lid; // return the user object for upcomming actions
      } catch (err) {
         logger(err);
         throw new UnauthorizedException('Credentials are not valid.');
      }
   }

   async veryifyUserRefreshToken(refreshToken: string, userId: number) {
      try {

         const token = await this.getRefreshToken(userId);
         const authenticated = await compare(refreshToken, token.REFRESH_TOKEN);
         if (!authenticated) {
            throw new UnauthorizedException();
         }
         return await this.ledenService.GetObject(userId);
      } catch (err) {
         logger(err);
         throw new UnauthorizedException('Refresh token is not valid.');
      }
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
}

