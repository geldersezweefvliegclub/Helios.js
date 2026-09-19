import {GetObjectsDateRequest} from "../../core/DTO/IHeliosFilter";
import {IsInt, IsOptional} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
import {OptionalNumberTransform} from "../../core/helpers/Transformers";

// query parameters voor Startlijst.GetLogboek, zie class.Startlijst.inc.php GetLogboek()
export class GetLogboekRequest extends GetObjectsDateRequest
{
   @IsOptional()
   @OptionalNumberTransform()
   @IsInt()
   @ApiProperty(
      {
         name: 'LID_ID',
         description: 'Logboek van een specifiek lid, als vlieger of als inzittende. Standaard het ingelogde lid',
         required: false,
         type: Number
      })
   public LID_ID?: number;

   @IsOptional()
   @OptionalNumberTransform()
   @IsInt()
   @ApiProperty(
      {
         name: 'VLIEGTUIG_ID',
         description: 'Logboek beperken tot een specifiek vliegtuig',
         required: false,
         type: Number
      })
   public VLIEGTUIG_ID?: number;

   @IsOptional()
   @OptionalNumberTransform()
   @IsInt()
   @ApiProperty(
      {
         name: 'JAAR',
         description: 'Alle vluchten van het opgegeven jaar',
         required: false,
         type: Number
      })
   public JAAR?: number;
}
