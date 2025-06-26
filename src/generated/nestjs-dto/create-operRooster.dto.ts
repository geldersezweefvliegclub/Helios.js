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
    description: "Het unieke ID van de dienst",
    type: "integer",
    format: "int32",
    default: "autoincrement",
    required: false,
  })
  @IsOptional()
  @IsInt()
  ID?: number;
  @ApiProperty({
    description: "Datum van de aanmelding",
    type: "string",
    format: "date-time",
  })
  @IsNotEmpty()
  @IsDateString()
  DATUM: Date;
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
    default: false,
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
    description: "Aantal aameldingen die we nodig hebben voor een sleepbedrijf",
    minimum: 0,
    maximum: 25,
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  MIN_SLEEPSTART?: number | null;
  @ApiProperty({
    description: "Aantal aameldingen die we nodig hebben voor een lierbedrijf",
    minimum: 0,
    maximum: 25,
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  MIN_LIERSTART?: number | null;
  @ApiProperty({
    description: "Eventuele opmerkingen, zoals eerder weg gaan",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  OPMERKINGEN?: string | null;
}
