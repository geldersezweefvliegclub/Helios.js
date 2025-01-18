import {GetObjectsRequest} from "../../core/DTO/IHeliosFilter";
import {IsOptional} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class GetObjectsHeliosDocumentenRequest extends GetObjectsRequest
{
   // hier komen de specifieke velden voor GetObjects
   @IsOptional()
   @ApiProperty(
      {
         required: false,
         description: 'Opvragen documenten van een specifiek lid',
         type: String
      })
   LID_ID?:  number;

   @IsOptional()
   @ApiProperty(
      {
         required: false,
         description: 'Opvragen documenten uit een specifieke groep',
         type: String
      })
   GROEP_ID?:  number;
}

