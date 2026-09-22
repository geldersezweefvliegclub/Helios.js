import {ApiProperty} from "@nestjs/swagger";
import {IsInt, IsOptional} from "class-validator";
import {OptionalNumberTransform} from "../../core/helpers/Transformers";

export class NieuwLidNummerRequest
{
   @IsOptional()
   @OptionalNumberTransform()
   @IsInt()
   @ApiProperty(
      {
         required: false,
         description: 'Jaar waarvoor het lidnummer gegenereerd wordt',
         type: Number
      })
   JAAR?: number;
}
