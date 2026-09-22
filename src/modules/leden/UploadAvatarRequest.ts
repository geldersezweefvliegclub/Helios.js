import {ApiProperty} from "@nestjs/swagger";
import {IsInt, IsString} from "class-validator";

// zie UploadAvatar() in class.Leden.inc.php
export class UploadAvatarRequest
{
   @IsInt()
   @ApiProperty(
      {
         required: true,
         description: 'ID van het lid waarvan de avatar wordt geupload',
         type: Number
      })
   ID: number;

   @IsString()
   @ApiProperty(
      {
         required: true,
         description: 'Afbeelding als data-URI (data:image/jpeg;base64,... / png / gif)',
         type: String
      })
   FILE: string;
}
