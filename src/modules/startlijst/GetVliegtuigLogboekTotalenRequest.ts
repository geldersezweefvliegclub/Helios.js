import {IsInt, IsOptional, IsString} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
import {OptionalNumberTransform} from "../../core/helpers/Transformers";

// query parameters voor Startlijst.GetVliegtuigLogboekTotalen, zie class.Startlijst.inc.php
// GetVliegtuigLogboekTotalen() - dit endpoint kent geen MAX/START/SORT (PHP wijst die af als onjuiste
// parameter), daarom géén GetObjectsRequest/GetObjectsDateRequest basisklasse
export class GetVliegtuigLogboekTotalenRequest
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
         name: 'ID',
         description: 'Logboek-totalen voor specifiek vliegtuig, ID is database ID van het vliegtuig',
         required: false,
         type: Number
      })
   public ID?: number;
}
