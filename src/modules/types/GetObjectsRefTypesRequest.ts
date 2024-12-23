import {GetObjectsRequest} from "../../core/DTO/IHeliosFilter";
import {IsOptional} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
import {OptionalNumberTransform} from "../../core/helpers/Transformers";

export class GetObjectsRefTypesRequest extends GetObjectsRequest
{
   // specifieke velden voor GetObjects
   @IsOptional()
   @OptionalNumberTransform()
   @ApiProperty(
      {
         name: 'GROEP',
         description: 'Voor welke groep moeten de types worden opgehaald',
         required: false,
         type: Number
      })
   public GROEP?: number;
}

