import {ApiProperty} from "@nestjs/swagger";
import {IsInt, IsOptional} from "class-validator";
import {CSVTransform, OptionalNumberTransform} from "../../core/helpers/Transformers";

export class HeeftCompetentieRequest
{
   @IsInt()
   @OptionalNumberTransform()
   @ApiProperty(
      {
         required: true,
         description: 'Competentie ID waarvoor gecontroleerd wordt welke leden een progressie record hebben',
         type: Number
      })
   COMPETENTIE_ID: number;

   @IsOptional()
   @CSVTransform()
   @ApiProperty(
      {
         required: false,
         description: 'CSV lijst van lid IDs om te controleren - niet meegeven controleert alle leden',
         type: String
      })
   LID_ID?: number[];
}
