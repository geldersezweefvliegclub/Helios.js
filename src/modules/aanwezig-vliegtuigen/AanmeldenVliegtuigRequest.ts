import {ApiProperty} from "@nestjs/swagger";
import {IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString} from "class-validator";

// body voor AanwezigVliegtuigen/Aanmelden - maakt een nieuwe aanmelding aan voor VLIEGTUIG_ID op DATUM, of
// past de bestaande aanmelding aan als die al bestaat, zie AanwezigVliegtuigen.Aanmelden() in de PHP implementatie
export class AanmeldenVliegtuigRequest
{
   @ApiProperty({type: "integer", format: "int32", description: "Vliegtuig dat wordt aangemeld"})
   @IsNotEmpty()
   @IsInt()
   VLIEGTUIG_ID: number;

   @ApiProperty({
      type: "string", format: "date", required: false,
      description: "Datum waarop het vliegtuig aanwezig is/zal zijn, standaard vandaag"
   })
   @IsOptional()
   @IsDateString()
   DATUM?: Date | string;

   @ApiProperty({type: "string", format: "date-time", required: false, nullable: true})
   @IsOptional()
   @IsString()
   AANKOMST?: Date | string | null;

   @ApiProperty({type: "number", required: false, nullable: true})
   @IsOptional()
   @IsNumber()
   LATITUDE?: number | null;

   @ApiProperty({type: "number", required: false, nullable: true})
   @IsOptional()
   @IsNumber()
   LONGITUDE?: number | null;

   @ApiProperty({type: "integer", format: "int32", required: false, nullable: true})
   @IsOptional()
   @IsInt()
   HOOGTE?: number | null;

   @ApiProperty({type: "integer", format: "int32", required: false, nullable: true})
   @IsOptional()
   @IsInt()
   SNELHEID?: number | null;

   @ApiProperty({type: "integer", format: "int32", required: false, nullable: true})
   @IsOptional()
   @IsInt()
   VELD_ID?: number | null;
}
