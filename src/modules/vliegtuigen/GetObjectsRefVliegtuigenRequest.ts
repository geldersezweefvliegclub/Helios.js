import {GetObjectsRequest} from "../../core/DTO/IHeliosFilter";
import {CSVTransform, OptionalBooleanTransform, OptionalNumberTransform} from "../../core/helpers/Transformers";
import {ApiProperty} from "@nestjs/swagger";
import {IsOptional} from "class-validator";

export class GetObjectsRefVliegtuigenRequest extends GetObjectsRequest
{
   // specifieke velden voor GetObjects
   @IsOptional()
   @ApiProperty(
      {
         required: false,
         description: 'Zoek in de velden REGISTRATIE, CALLSIGN, FLARMCODE',
         type: String
      })
   SELECTIE?: string;

   @IsOptional()
   @CSVTransform()
   @ApiProperty(
      {
         required: false,
         description: 'CSV lijst van vliegtuig type IDs van types (4055, 4056)',
         type: String
      })
   public TYPES?: number[];

   @IsOptional()
   @OptionalNumberTransform()
   @ApiProperty(
      {
         required: false,
         description: 'Vliegtuigen met aantal zitplaatsen',
         type: "number",
         minimum: 1,
         maximum: 2
      })
   public ZITPLAATSEN: number;

   @IsOptional()
   @OptionalBooleanTransform()
   @ApiProperty(
      {
         required: false,
         description: 'Als "true", dan worden alleen clubkisten opgehaald',
         type: "boolean"
      })
   public CLUBKIST: boolean;

   @IsOptional()
   @OptionalBooleanTransform()
   @ApiProperty(
      {
         required: false,
         description: 'Als "true", dan worden alleen zelfstarters opgehaald',
         type: "boolean"
      })
   public ZELFSTART? : boolean;

   @IsOptional()
   @OptionalBooleanTransform()
   @ApiProperty(
      {
         required: false,
         description: 'Als "true", dan worden alleen TMG opgehaald',
         type: "boolean"
      })
   public TMG? : boolean;

   @IsOptional()
   @OptionalBooleanTransform()
   @ApiProperty(
      {
         required: false,
         description: 'Als "true", dan worden alleen sleepkisten opgehaald',
         type: "boolean"
      })
   public SLEEPKIST? : boolean;
}

