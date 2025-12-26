import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateOperAgendaDto {
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
  })
  @IsNotEmpty()
  @IsDateString()
  DATUM: Date;
  @ApiProperty({
    description:
      "Tijd van het agenda-item, indien van toepassing (kan leeg zijn als hele dag)",
    type: "string",
    format: "date-time",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  TIJD?: Date | null;
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
    type: "integer",
    format: "int32",
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  OPENBAAR?: number;
}
