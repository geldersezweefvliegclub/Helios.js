import {GetObjectsDateRequest} from "../../core/DTO/IHeliosFilter";
import {IsInt, IsOptional} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
import {OptionalNumberTransform} from "../../core/helpers/Transformers";

// query parameters voor Startlijst.GetVliegtuigLogboek, zie class.Startlijst.inc.php GetVliegtuigLogboek()
export class GetVliegtuigLogboekRequest extends GetObjectsDateRequest
{
   // overschrijft de generieke ID (van GetObjectsRequest, bedoeld om op het eigen record-ID te filteren) -
   // voor dit endpoint is ID het vliegtuig ID, exact zoals in de PHP implementatie
   @IsOptional()
   @OptionalNumberTransform()
   @IsInt()
   @ApiProperty(
      {
         name: 'ID',
         description: 'Logboek voor specifiek vliegtuig, ID is database ID van het vliegtuig',
         required: false,
         type: Number
      })
   public ID?: number;
}
