import {ApiProperty} from "@nestjs/swagger";
import {IsArray, IsInt} from "class-validator";

// zie AanmakenFacturen() in class.Facturen.inc.php
export class AanmakenFacturenRequest
{
   @IsInt()
   @ApiProperty(
      {
         required: true,
         description: 'Jaar waarvoor de facturen aangemaakt worden',
         type: Number
      })
   JAAR: number;

   @IsArray()
   @IsInt({each: true})
   @ApiProperty(
      {
         required: true,
         description: 'Lid IDs waarvoor een factuur aangemaakt wordt',
         type: [Number]
      })
   LID_ID: number[];
}
