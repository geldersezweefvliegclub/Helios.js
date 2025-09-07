import {applyDecorators} from "@nestjs/common";
import {ApiQuery} from "@nestjs/swagger";
import {RefLid} from "@prisma/client";

export const GetLoginRequest  = () =>
   applyDecorators(
      ApiQuery({name: 'INLOGNAAM', required: false, type: String}),
      ApiQuery({name: 'WACHTWOORD', required: false, type: String}),
   );

export interface LoginResponse {
   Authentication: {
      AccessToken: string,
      ExpiresInMs: number
   },
   Refresh: {
      AccessToken: string,
      ExpiresInMs: number
   }
}

export class UserInfo {
   LidData: RefLid;
   Userinfo: {
      isBeheerderDDWV: boolean,
      isBeheerder: boolean,
      isRooster: boolean,
      isInstructeur: boolean,
      isCIMT: boolean,
      isStarttoren: boolean,
      isRapporteur: boolean,
      isDDWVCrew: boolean,
      isAangemeld: boolean,
      isClubVlieger: boolean,
      isDDWV: boolean
   }
}