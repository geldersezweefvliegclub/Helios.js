import {GetObjectsDateRequest } from "../../core/DTO/IHeliosFilter";
import {CSVTransform, OptionalBooleanTransform, OptionalNumberTransform} from "../../core/helpers/Transformers";
import {ApiProperty} from "@nestjs/swagger";
import {IsOptional} from "class-validator";

export class GetObjectsOperAanwezigLedenRequest extends GetObjectsDateRequest
{
   // specifieke velden voor GetObjects
   @IsOptional()
   @CSVTransform()
   @ApiProperty(
      {
         required: false,
         description: 'CSV lijst van LID_IDs die opgehaald moeten worden',
         type: String
      })
   public IN?: number[];

   @IsOptional()
   @ApiProperty(
      {
         required: false,
         description: 'Zoek in de naam van het lid',
         type: String
      })
   public SELECTIE?: string;

   @IsOptional()
   @CSVTransform()
   @ApiProperty(
      {
         required: false,
         description: 'CSV lijst van IDs van lidtypes (601,602)',
         type: String
      })
   public TYPES?: number[];

   @IsOptional()
   @OptionalBooleanTransform()
   @ApiProperty(
      {
         required: false,
         description: 'Als "true", dan worden alleen leden opgehaald die nog niet vertrokken zijn',
         type: "boolean"
      })
   public NIET_VERTROKKEN?: boolean;

   @IsOptional()
   @OptionalNumberTransform()
   @ApiProperty(
      {
         required: false,
         description: 'Enkel aanmeldingen op dit vliegveld (VELD_ID)',
         type: Number
      })
   public VLIEGVELD?: number;
}
