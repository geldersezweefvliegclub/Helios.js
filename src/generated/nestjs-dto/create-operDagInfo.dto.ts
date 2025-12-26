import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, IsOptional, IsString } from "class-validator";

export class CreateOperDagInfoDto {
  @ApiProperty({
    description: "Het unieke ID van de daginfo",
    type: "integer",
    format: "int32",
    default: "autoincrement",
    required: false,
  })
  @IsOptional()
  @IsInt()
  ID?: number;
  @ApiProperty({
    description: "Datum van de daginfo",
    type: "string",
    format: "date-time",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  DATUM?: Date;
  @ApiProperty({
    description: "Referentie naar het vliegveld in de type tabel",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  VELD_ID?: number | null;
  @ApiProperty({
    description: "Referentie naar de baan in de type tabel",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  BAAN_ID?: number | null;
  @ApiProperty({
    description:
      "Referentie naar het vliegveld in de type tabel, bijv voor (buitenland)kamp",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  VELD_ID2?: number | null;
  @ApiProperty({
    description: "Referentie naar de baan in de type tabel",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  BAAN_ID2?: number | null;
  @ApiProperty({
    description: "Referentie naar de startmethode in de type tabel",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  STARTMETHODE_ID2?: number | null;
  @ApiProperty({
    description: "Zijn er bijzondere gebeurtenissen geweest deze dag",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  INCIDENTEN?: string | null;
  @ApiProperty({
    description: "Beschrijving van het vliegbedrijf deze dag",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  VLIEGBEDRIJF?: string | null;
  @ApiProperty({
    description: "Weersomstandigheden deze dag",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  METEO?: string | null;
  @ApiProperty({
    description: "Beschrijven wie aanwezig was voor alle diensten",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  DIENSTEN?: string | null;
  @ApiProperty({
    description: "Overige bijzonderheden en opmerkingen deze dag",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  VERSLAG?: string | null;
  @ApiProperty({
    description: "Opmerkingen over het grondmaterieel deze dag",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  ROLLENDMATERIEEL?: string | null;
  @ApiProperty({
    description: "Opmerkingen over het vliegmaterieel deze dag",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  VLIEGENDMATERIEEL?: string | null;
  @ApiProperty({
    description: "Is het een DDWV bedrijf op het primaire veld",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  DDWV?: number;
  @ApiProperty({
    description: "Is het een clubbedrijf op het primaire veld",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  CLUB_BEDRIJF?: number;
}
