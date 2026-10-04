import {IsDate, IsInt, IsOptional, IsString} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
import {OptionalDateTransform, OptionalNumberTransform} from "../../core/helpers/Transformers";

// query parameters voor Startlijst.GetVliegDagen, zie class.Startlijst.inc.php GetVliegDagen() - dit endpoint
// kent geen START/DATUM/ID/VERWIJDERD, daarom géén GetObjectsRequest/GetObjectsDateRequest basisklasse
export class GetVliegDagenRequest
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
   @IsString()
   @ApiProperty(
      {
         name: 'SORT',
         description: 'Sortering van de dataset op DATUM, STARTS of VLIEGTIJD, bijvoorbeeld "DATUM DESC". Standaard "DATUM"',
         required: false,
         type: String
      })
   public SORT?: string;

   @IsOptional()
   @OptionalNumberTransform()
   @IsInt()
   @ApiProperty(
      {
         name: 'MAX',
         description: 'Maximum aantal dagen in de dataset',
         required: false,
         type: Number
      })
   public MAX?: number;

   @IsOptional()
   @OptionalDateTransform()
   @IsDate()
   @ApiProperty(
      {
         name: 'BEGIN_DATUM',
         description: 'Begin datum (inclusief). Zonder BEGIN_DATUM en EIND_DATUM wordt het huidige jaar opgehaald',
         required: false,
         type: Date
      })
   public BEGIN_DATUM?: Date;

   @IsOptional()
   @OptionalDateTransform()
   @IsDate()
   @ApiProperty(
      {
         name: 'EIND_DATUM',
         description: 'Eind datum (inclusief). Zonder BEGIN_DATUM en EIND_DATUM wordt het huidige jaar opgehaald',
         required: false,
         type: Date
      })
   public EIND_DATUM?: Date;

   @IsOptional()
   @OptionalNumberTransform()
   @IsInt()
   @ApiProperty(
      {
         name: 'LID_ID',
         description: 'Alleen de vliegdagen van een specifiek lid, als vlieger of als inzittende',
         required: false,
         type: Number
      })
   public LID_ID?: number;
}
