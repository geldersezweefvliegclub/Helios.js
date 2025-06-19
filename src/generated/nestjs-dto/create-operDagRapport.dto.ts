import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateOperDagRapportDto {
  @ApiProperty({
    description: "Het unieke ID van een dagrapport",
    type: "integer",
    format: "int32",
    default: "autoincrement",
    required: false,
  })
  @IsOptional()
  @IsInt()
  ID?: number;
  @ApiProperty({
    description: "Datum van het dagrapport",
    type: "string",
    format: "date-time",
  })
  @IsNotEmpty()
  @IsDateString()
  DATUM: Date;
  @ApiProperty({
    description: "Referentie naar het veld in de type tabel",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  VELD_ID?: number;
  @ApiProperty({
    description:
      "Verwijzing naar het lid ID van de persoon die gewerkt heeft, link naar de leden tabel",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  INGEVOERD_ID?: number;
  @ApiProperty({
    description: "Beschrijving van de incidenten",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  INCIDENTEN?: string | null;
  @ApiProperty({
    description: "Weersinformatie",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  METEO?: string | null;
  @ApiProperty({
    description:
      "Diegene die dienst hebben gedaan, startleider, DDI, lierist etc",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  DIENSTEN?: string | null;
  @ApiProperty({
    description: "Algemeen verslag van het vliegbedrijf",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  VERSLAG?: string | null;
  @ApiProperty({
    description: "Bijzonderheden over rollend materieel",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  ROLLENDMATERIEEL?: string | null;
  @ApiProperty({
    description: "Bijzonderheden over de vliegtuigen",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  VLIEGENDMATERIEEL?: string | null;
}
