import {ApiProperty} from "@nestjs/swagger";
import {IsDate, IsInt} from "class-validator";
import {OptionalDateTransform} from "../../core/helpers/Transformers";

// zie uploadTransactieFactuur() in class.Facturen.inc.php
export class UploadTransactieFactuurRequest
{
   @IsInt()
   @ApiProperty(
      {
         required: true,
         description: 'LID_ID van de vlieger waarvan de DDWV-transacties gefactureerd worden',
         type: Number
      })
   LID_ID: number;

   @IsDate()
   @OptionalDateTransform()
   @ApiProperty(
      {
         required: true,
         description: 'Vliegdag waarvoor de DDWV-transacties gefactureerd worden',
         type: Date
      })
   DATUM: Date;
}
