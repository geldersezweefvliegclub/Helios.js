import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateOperStartlijstDto {
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
  })
  @IsNotEmpty()
  @IsDateString()
  DATUM: Date;
  @ApiProperty({
    description: "De starttijd van de vlucht",
    type: "string",
    format: "date-time",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  STARTTIJD?: Date | null;
  @ApiProperty({
    description: "De landingtijd van de vlucht",
    type: "string",
    format: "date-time",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  LANDINGSTIJD?: Date | null;
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
}
