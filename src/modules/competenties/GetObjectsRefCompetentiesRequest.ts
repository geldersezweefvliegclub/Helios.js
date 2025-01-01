import {GetObjectsRequest} from "../../core/DTO/IHeliosFilter";
import {OptionalNumberTransform} from "../../core/helpers/Transformers";
import {ApiProperty} from "@nestjs/swagger";
import {IsOptional} from "class-validator";

export class GetObjectsRefCompetentiesRequest extends GetObjectsRequest
{
   @IsOptional()
   @OptionalNumberTransform()
   @ApiProperty(
      {
         required: false,
         description: 'Leerfase, link naar types',
         type: "number",
      })
   public LEERFASE_ID?: number;
}

