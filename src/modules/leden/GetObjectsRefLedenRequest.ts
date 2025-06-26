import {GetObjectsRequest} from "../../core/DTO/IHeliosFilter";
import {CSVTransform, OptionalBooleanTransform} from "../../core/helpers/Transformers";
import {ApiProperty} from "@nestjs/swagger";
import {IsOptional} from "class-validator";

export class GetObjectsRefLedenRequest extends GetObjectsRequest
{
   // specifieke velden voor GetObjects
   @IsOptional()
   @ApiProperty(
       {
          required: false,
          description: 'Zoek in de velden NAAM, EMAIL, TELEFOON, MOBIEL, NOODNUMMER',
          type: String
       })
   SELECTIE?: string;

   @IsOptional()
   @CSVTransform()
   @ApiProperty(
      {
         required: false,
         description: 'CSV lijst van IDs van types (601,602)',
         type: String
      })
   public TYPES?: number[];

   @IsOptional()
   @OptionalBooleanTransform()
   @ApiProperty(
      {
         required: false,
         description: 'Als "true", dan worden alleen clubleden opgehaald',
         type: "boolean"
      })
   public CLUBLEDEN?: boolean;

   @IsOptional()
   @OptionalBooleanTransform()
   @ApiProperty(
      {
         required: false,
         description: 'Als "true", dan worden alleen instructeurs opgehaald',
         type: "boolean"
      })
   public INSTRUCTEURS? : boolean;

   @IsOptional()
   @OptionalBooleanTransform()
   @ApiProperty(
      {
         required: false,
         description: 'Als "true", dan worden alleen lieristen opgehaald',
         type: "boolean"
      })
   public LIERISTEN? : boolean;

   @IsOptional()
   @OptionalBooleanTransform()
   @ApiProperty(
      {
         required: false,
         description: 'Als "true", dan worden alleen lieristen in opleiding opgehaald',
         type: "boolean"
      })
   public LIO? : boolean;

   @IsOptional()
   @OptionalBooleanTransform()
   @ApiProperty(
      {
         required: false,
         description: 'Als "true", dan worden alleen startleiders opgehaald',
         type: "boolean"
      })
   public STARTLEIDERS? : boolean;

   @IsOptional()
   @OptionalBooleanTransform()
   @ApiProperty(
      {
         required: false,
         description: 'Als "true", dan wordt alleen de DDWV crew opgehaald',
         type: "boolean"
      })
   public DDWV_CREW? : boolean;

   @IsOptional()
   @OptionalBooleanTransform()
   @ApiProperty(
      {
         required: false,
         description: 'Als "true", dan wordt alleen de beheerder opgehaald',
         type: "boolean"
      })
   public BEHEERDERS? : boolean;

   @IsOptional()
   @OptionalBooleanTransform()
   @ApiProperty(
      {
         required: false,
         description: 'Als "true", dan worden alleen leden met brandstofpas opgehaald',
         type: "boolean"
      })
   public BRANDSTOF_PAS? : boolean;
}

