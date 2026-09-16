import {ApiProperty} from "@nestjs/swagger";
import {IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString} from "class-validator";

// body voor AanwezigLeden/Aanmelden - maakt een nieuwe aanmelding aan voor LID_ID op DATUM, of past de
// bestaande aanmelding aan als die al bestaat (bv. een tweede aanmelding op dezelfde dag met een ander
// gewenst vliegtuigtype)
export class AanmeldenRequest
{
   @ApiProperty({type: "integer", format: "int32", description: "Lid dat zich aanmeldt"})
   @IsNotEmpty()
   @IsInt()
   LID_ID: number;

   @ApiProperty({
      type: "string", format: "date", required: false,
      description: "Datum waarop het lid aanwezig is/zal zijn, standaard vandaag"
   })
   @IsOptional()
   @IsDateString()
   DATUM?: Date | string;

   @ApiProperty({
      type: "string", format: "date-time", required: false,
      description: "Tijdstip van de aanmelding zelf (voor eventuele correcties achteraf), standaard nu"
   })
   @IsOptional()
   @IsDateString()
   TIJDSTIP?: Date | string;

   @ApiProperty({type: "integer", format: "int32", required: false, nullable: true})
   @IsOptional()
   @IsInt()
   POSITIE?: number | null;

   @ApiProperty({type: "boolean", required: false})
   @IsOptional()
   @IsBoolean()
   VOORAANMELDING?: boolean;

   @ApiProperty({type: "string", format: "date-time", required: false, nullable: true})
   @IsOptional()
   @IsString()
   AANKOMST?: Date | string | null;

   @ApiProperty({type: "integer", format: "int32", required: false, nullable: true})
   @IsOptional()
   @IsInt()
   OVERLAND_VLIEGTUIG_ID?: number | null;

   @ApiProperty({
      type: "string", required: false, nullable: true,
      description: "Comma-separated lijst van gewenste vliegtuigtypes - wordt bij een bestaande aanmelding " +
         "aangevuld, niet overschreven"
   })
   @IsOptional()
   @IsString()
   VOORKEUR_VLIEGTUIG_TYPE?: string | null;

   @ApiProperty({type: "integer", format: "int32", required: false, nullable: true})
   @IsOptional()
   @IsInt()
   VELD_ID?: number | null;

   @ApiProperty({type: "string", required: false, nullable: true})
   @IsOptional()
   @IsString()
   OPMERKINGEN?: string | null;
}
