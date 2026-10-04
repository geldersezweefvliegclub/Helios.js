import {IsInt, IsOptional, IsString} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
import {OptionalNumberTransform} from "../../core/helpers/Transformers";

// query parameters voor Startlijst.GetLogboekTotalen, zie class.Startlijst.inc.php GetLogboekTotalen() - dit
// endpoint kent geen MAX/START/SORT (PHP wijst die af als onjuiste parameter), daarom géén
// GetObjectsRequest/GetObjectsDateRequest basisklasse
export class GetLogboekTotalenRequest
{
   @IsOptional()
   @IsString()
   @ApiProperty(
      {
         name: 'HASH',
         description: 'HASH van laatste aanroep. Bij ongewijzigde data volgt HTTP status code 304',
         required: false,
         type: String
      })
   public HASH?: string;

   @IsOptional()
   @OptionalNumberTransform()
   @IsInt()
   @ApiProperty(
      {
         name: 'JAAR',
         description: 'Jaar waarvoor de totalen opgehaald worden. Standaard het huidige jaar',
         required: false,
         type: Number
      })
   public JAAR?: number;

   @IsOptional()
   @OptionalNumberTransform()
   @IsInt()
   @ApiProperty(
      {
         name: 'LID_ID',
         description: 'Logboek-totalen van een specifiek lid. Standaard het ingelogde lid',
         required: false,
         type: Number
      })
   public LID_ID?: number;
}
