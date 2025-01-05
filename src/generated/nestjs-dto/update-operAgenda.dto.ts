import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
} from "class-validator";

export class UpdateOperAgendaDto {
  @ApiProperty({
    description: "Het unieke ID van een agenda-item",
    type: "integer",
    format: "int32",
    default: "autoincrement",
    required: false,
  })
  @IsOptional()
  @IsInt()
  ID?: number;
  @ApiProperty({
    description: "Datum van het agenda-item",
    type: "string",
    format: "date-time",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  DATUM?: Date;
  @ApiProperty({
    description: "Korte beschrijving van het agenda-item",
    maxLength: 255,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  KORT?: string | null;
  @ApiProperty({
    description: "Gedetailleerde beschrijving van het agenda-item",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  OMSCHRIJVING?: string | null;
  @ApiProperty({
    description: "Is het agenda-item openbaar",
    type: "boolean",
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  OPENBAAR?: boolean;
}
