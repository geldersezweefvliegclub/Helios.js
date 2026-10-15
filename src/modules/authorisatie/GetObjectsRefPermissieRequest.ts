import {GetObjectsRequest} from "../../core/DTO/IHeliosFilter";
import {IsInt, IsOptional, IsString} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
import {OptionalNumberTransform} from "../../core/helpers/Transformers";

export class GetObjectsRefPermissieRequest extends GetObjectsRequest
{
   // specifieke velden voor GetObjects
   @IsOptional()
   @OptionalNumberTransform()
   @IsInt()
   @ApiProperty(
      {
         name: 'ROL_ID',
         description: 'Voor welke rol (of lidtype) moeten de permissies worden opgehaald',
         required: false,
         type: Number
      })
   public ROL_ID?: number;

   @IsOptional()
   @IsString()
   @ApiProperty(
      {
         name: 'ENDPOINT',
         description: 'Voor welk endpoint moeten de permissies worden opgehaald, bijv Leden.UpdateObject of Leden.*',
         required: false,
         type: String
      })
   public ENDPOINT?: string;
}
