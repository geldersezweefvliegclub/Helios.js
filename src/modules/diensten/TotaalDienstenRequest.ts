import {IsInt, IsOptional} from "class-validator";
import {Type} from "class-transformer";
import {ApiProperty} from "@nestjs/swagger";
import {OptionalNumberTransform} from "../../core/helpers/Transformers";

// DTO voor Diensten/TotaalDiensten, zie TotaalDiensten() in class.Diensten.inc.php
export class TotaalDienstenRequest {
   @Type(() => Number)
   @IsInt()
   @ApiProperty({
      name: 'JAAR',
      required: true,
      type: Number,
      description: 'Jaartal waarover de diensten geteld worden'
   })
   JAAR: number;

   @IsOptional()
   @OptionalNumberTransform()
   @IsInt()
   @ApiProperty({
      name: 'LID_ID',
      required: false,
      type: Number,
      description: 'Beperk de telling tot een specifiek lid'
   })
   LID_ID?: number;
}
