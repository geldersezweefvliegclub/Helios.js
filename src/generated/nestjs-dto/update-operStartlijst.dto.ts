import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
} from "class-validator";

export class UpdateOperStartlijstDto {
  @ApiProperty({
    description: "Het unieke ID van het startlijst record",
    type: "integer",
    format: "int32",
    default: "autoincrement",
    required: false,
  })
  @IsOptional()
  @IsInt()
  ID?: number;
  @ApiProperty({
    description: "De datum van de vlucht",
    type: "string",
    format: "date-time",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  DATUM?: Date;
  @ApiProperty({
    description: "Het vliegtuig dat gebruikt is voor de vlucht",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  VLIEGTUIG_ID?: number;
  @ApiProperty({
    description: "De starttijd van de vlucht",
    type: "string",
    format: "date-time",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  STARTTIJD?: Date | null;
  @ApiProperty({
    description: "De landingtijd van de vlucht",
    type: "string",
    format: "date-time",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  LANDINGSTIJD?: Date | null;
  @ApiProperty({
    description: "De startmethode die gebruikt is voor de vlucht",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  STARTMETHODE_ID?: number | null;
  @ApiProperty({
    description: "De piloot die de vlucht heeft uitgevoerd",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  VLIEGER_ID?: number | null;
  @ApiProperty({
    description: "De inzittende die meegevlogen heeft",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  INZITTENDE_ID?: number | null;
  @ApiProperty({
    description:
      "Naam van de vlieger op het moment van de vlucht (voor historische doeleinden)",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  VLIEGERNAAM?: string | null;
  @ApiProperty({
    description:
      "Naam van de inzittende op het moment van de vlucht (voor historische doeleinden)",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  INZITTENDENAAM?: string | null;
  @ApiProperty({
    description: "Het sleepvliegtuig dat gebruikt is voor de vlucht",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  SLEEPKIST_ID?: number | null;
  @ApiProperty({
    description: "De hoogte waarop is losgekoppeld tijdens de sleep",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  SLEEP_HOOGTE?: number | null;
  @ApiProperty({
    description: "Het veld van waaruit is gestart",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  VELD_ID?: number | null;
  @ApiProperty({
    description: "De baan waarop is gestart",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  BAAN_ID?: number | null;
  @ApiProperty({
    description: "Eventuele opmerkingen bij de vlucht",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  OPMERKINGEN?: string | null;
  @ApiProperty({
    description: "Externe referentie ID voor koppelingen met externe systemen",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  EXTERNAL_ID?: string | null;
  @ApiProperty({
    description: "Is het record gemarkeerd als verwijderd",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  VERWIJDERD?: boolean;
  @ApiProperty({
    description: "Tijdstempel met de laatste wijziging van het record",
    type: "string",
    format: "date-time",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  LAATSTE_AANPASSING?: Date;
}
