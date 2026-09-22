import {ApiProperty} from "@nestjs/swagger";
import {IsInt} from "class-validator";

// zie UploadFactuur() in class.Facturen.inc.php
export class UploadFactuurRequest
{
   @IsInt()
   @ApiProperty(
      {
         required: true,
         description: 'ID van de factuur waarvoor de factuurgegevens op de MQTT bus gepubliceerd worden',
         type: Number
      })
   ID: number;
}
