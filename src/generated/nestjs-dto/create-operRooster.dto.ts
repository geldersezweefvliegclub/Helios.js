import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateOperRoosterDto {
  @ApiProperty({
    description: "Het unieke ID van het rooster record",
    type: "integer",
    format: "int32",
    default: "autoincrement",
    required: false,
  })
  @IsOptional()
  @IsInt()
  ID?: number;
  @ApiProperty({
    description: "Datum van de vliegdag",
    type: "string",
    format: "date-time",
  })
  @IsNotEmpty()
  @IsDateString()
  DATUM: Date;
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
    description: "Is het een Club bedrijf op het primaire veld",
    type: "integer",
    format: "int32",
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  CLUB_BEDRIJF?: number;
  @ApiProperty({
    description: "Voeren we winterwerk uit op deze datum?",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  WINTER_WERK?: boolean;
  @ApiProperty({
    description:
      "Aantal aameldingen die we nodig hebben voor een sleepbedrijf (alleen DDWV)",
    minimum: 0,
    maximum: 25,
    type: "integer",
    format: "int32",
    default: 3,
    required: false,
  })
  @IsOptional()
  @IsInt()
  MIN_SLEEPSTART?: number;
  @ApiProperty({
    description:
      "Aantal aameldingen die we nodig hebben voor een lierbedrijf (alleen DDWV)",
    minimum: 0,
    maximum: 25,
    type: "integer",
    format: "int32",
    default: 10,
    required: false,
  })
  @IsOptional()
  @IsInt()
  MIN_LIERSTART?: number;
  @ApiProperty({
    description: "Eventuele opmerkingen voor deze dag",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  OPMERKINGEN?: string | null;
}
