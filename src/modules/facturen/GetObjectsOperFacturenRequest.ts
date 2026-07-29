import {GetObjectsDateRequest } from "../../core/DTO/IHeliosFilter";
import {CSVTransform, OptionalNumberTransform} from "../../core/helpers/Transformers";
import {ApiProperty} from "@nestjs/swagger";
import {IsOptional} from "class-validator";

export class GetObjectsOperFacturenRequest extends GetObjectsDateRequest
{
   // specifieke velden voor GetObjects
   @IsOptional()
   @OptionalNumberTransform()
   @ApiProperty(
      {
         required: false,
         description: 'Enkel facturen van dit jaar (of zonder jaar)',
         type: Number
      })
   public JAAR?: number;

   @IsOptional()
   @CSVTransform()
   @ApiProperty(
      {
         required: false,
         description: 'CSV lijst van LID_IDs',
         type: String
      })
   public LID_ID?: number[];

   @IsOptional()
   @ApiProperty(
      {
         required: false,
         description: 'Zoek in de velden NAAM, FACTUUR_NUMMER, OMSCHRIJVING, LIDNR',
         type: String
      })
   public SELECTIE?: string;
}

