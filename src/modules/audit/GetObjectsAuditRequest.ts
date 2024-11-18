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
}