import {GetObjectsDateRequest, GetObjectsRequest} from "../../core/DTO/IHeliosFilter";
import {CSVTransform, OptionalBooleanTransform} from "../../core/helpers/Transformers";
import {ApiProperty} from "@nestjs/swagger";
import {IsNumber, IsOptional} from "class-validator";

export class GetObjectsOperJournaalRequest extends GetObjectsDateRequest
{
   // specifieke velden voor GetObjects
   @IsOptional()
   @ApiProperty(
      {
         required: false,
         description: 'Zoek in de velden REGISTRATIE, CALLSIGN, OMSCHRIJVING, TITEL, MELDER',
         type: String
      })
   SELECTIE?: string;

   @IsOptional()
   @CSVTransform()
   @ApiProperty(
       {
          required: false,
          description: 'Zoek alle journaals op van dit vliegtuig(en). In CSV formaat',
          type: String
       })
   VLIEGTUIG_ID?:  number[];

   @IsOptional()
   @CSVTransform()
   @ApiProperty(
      {
         required: false,
         description: 'Zoek alle journaals op van dit rollend materieel. In CSV formaat',
         type: String
      })
   ROLLEND_ID?:  number[];

   @IsOptional()
   @IsNumber()
   @ApiProperty(
      {
         required: false,
         description: 'Zoek alle journaals op die ingevoerd zijn door dit lid',
         type: String
      })
   MELDER_ID?:  number[];

   @IsOptional()
   @IsNumber()
   @ApiProperty(
      {
         required: false,
         description: 'Zoek alle journaals op die toegekend zijn aan deze technicus',
         type: String
      })
   TECHNICUS_ID?:  number[];

   @IsOptional()
   @CSVTransform()
   @ApiProperty(
      {
         required: false,
         description: 'Zoek alle journaals op die deze categorieen hebben. In CSV formaat',
         type: String
      })
   CATEGORIE_ID?:  number[];

   @IsOptional()
   @CSVTransform()
   @ApiProperty(
      {
         required: false,
         description: 'Zoek alle journaals op die deze status(es) hebben. In CSV formaat',
         type: String
      })
   STATUS_ID?:  number[];
}

