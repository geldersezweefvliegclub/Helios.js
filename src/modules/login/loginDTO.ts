import {applyDecorators} from "@nestjs/common";
import {ApiProperty, ApiQuery} from "@nestjs/swagger";
import {RefLid} from "@prisma/client";
import {RefLidDto} from "../../generated/nestjs-dto/refLid.dto";

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

export class UserInfoRollen {
   @ApiProperty({type: Boolean}) isBeheerderDDWV: boolean;
   @ApiProperty({type: Boolean}) isBeheerder: boolean;
   @ApiProperty({type: Boolean}) isRooster: boolean;
   @ApiProperty({type: Boolean}) isInstructeur: boolean;
   @ApiProperty({type: Boolean}) isCIMT: boolean;
   @ApiProperty({type: Boolean}) isStarttoren: boolean;
   @ApiProperty({type: Boolean}) isRapporteur: boolean;
   @ApiProperty({type: Boolean}) isDDWVCrew: boolean;
   @ApiProperty({type: Boolean}) isAangemeld: boolean;
   @ApiProperty({type: Boolean}) isClubVlieger: boolean;
   @ApiProperty({type: Boolean}) isDDWV: boolean;
}

export class UserInfo {
   @ApiProperty({type: RefLidDto, description: 'Gegevens van het ingelogde lid'})
   LidData: RefLid;

   @ApiProperty({type: UserInfoRollen, description: 'Rollen en status van het ingelogde lid'})
   Userinfo: UserInfoRollen;
}