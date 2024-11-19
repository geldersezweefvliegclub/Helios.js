import {GetObjectsDateRequest} from "../../core/DTO/IHeliosFilter";
import {IsOptional} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
import {OptionalNumberTransform} from "../../core/helpers/Transformers";

export class GetObjectsAuditRequest extends GetObjectsDateRequest
{
   // hier komen de specifieke velden voor GetObjects

   @IsOptional()
   @OptionalNumberTransform()
   @ApiProperty(
      {
         required: false,
         description: 'Lid dat behoort bij audit record',
         type: Number
      })
   public LID_ID?: number;

   @IsOptional()
   @ApiProperty(
      {
         required: false,
         description: 'Zoek in de velden NAAM, TABEL, ACTIE, VOOR, DATA, RESULTAAT',
         type: String
      })
   SELECTIE?: string;

   @IsOptional()
   @OptionalNumberTransform()
   @ApiProperty(
      {
         required: false,
         description: 'Eerste ID van de op te halen records',
         type: Number
      })
   public BEGIN_ID?: number;

   @IsOptional()
   @OptionalNumberTransform()
   @ApiProperty(
      {
         required: false,
         description: 'Laatste ID van de op te halen records',
         type: Number
      })
   public EIND_ID?: number;

   @IsOptional()
   @ApiProperty(
      {
         required: false,
         description: 'Zoek in de audit record van deze tabel',
         type: String
      })
   TABEL?: string;
}