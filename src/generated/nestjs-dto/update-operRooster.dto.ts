import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
} from "class-validator";

export class UpdateOperRoosterDto {
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
    required: false,
  })
  @IsOptional()
  @IsDateString()
  DATUM?: Date;
  @ApiProperty({
    description: "Is het een DDWV bedrijf op het primaire veld",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  DDWV?: boolean;
  @ApiProperty({
    description: "Is het een Club bedrijf op het primaire veld",
    type: "boolean",
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  CLUB_BEDRIJF?: boolean;
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
  @ApiProperty({
    description:
      "Is het record gemarkeerd als verwijderd - wordt genegeerd via UpdateObject/SaveObject, enkel DeleteObject/RestoreObject wijzigen dit daadwerkelijk",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  VERWIJDERD?: boolean;
  @ApiProperty({
    description:
      "Tijdstempel met de laatste wijziging van het record, altijd automatisch gezet - een meegegeven waarde wordt genegeerd",
    type: "string",
    format: "date-time",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  LAATSTE_AANPASSING?: Date;
}
