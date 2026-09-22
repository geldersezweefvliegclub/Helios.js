import {IsInt, IsOptional, IsString} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
import {OptionalNumberTransform} from "../../core/helpers/Transformers";

export class NogTeFacturerenRequest
{
   @IsInt()
   @OptionalNumberTransform()
   @ApiProperty(
      {
         required: true,
         description: 'Jaar waarvoor gecontroleerd wordt welke leden nog geen factuur hebben',
         type: Number
      })
   JAAR: number;

   @IsOptional()
   @IsString()
   @ApiProperty(
      {
         required: false,
         description: 'Hash van een eerder opgehaalde dataset, ongewijzigd geeft een 304',
         type: String
      })
   HASH?: string;
}
