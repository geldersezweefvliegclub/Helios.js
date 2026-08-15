import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
} from "class-validator";

export class UpdateOperTrackDto {
  @ApiProperty({
    description: "Het unieke ID van een track",
    type: "integer",
    format: "int32",
    default: "autoincrement",
    required: false,
  })
  @IsOptional()
  @IsInt()
  ID?: number;
  @ApiProperty({
    description:
      "Verwijzing naar het lid waarover de track gaat, link naar de leden tabel",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  LID_ID?: number;
  @ApiProperty({
    description:
      "Verwijzing naar de instructeur die de track heeft ingevoerd, link naar de leden tabel",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  INSTRUCTEUR_ID?: number | null;
  @ApiProperty({
    description: "Omschrijving van de track",
    type: "string",
    required: false,
  })
  @IsOptional()
  @IsString()
  TEKST?: string;
  @ApiProperty({
    description: "Verwijzing naar de startlijst waar deze track bij hoort",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  START_ID?: number | null;
  @ApiProperty({
    description: "Tijdstempel wanneer de track is ingevoerd",
    type: "string",
    format: "date-time",
    default: new Date().toISOString(),
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  INGEVOERD?: Date | null;
  @ApiProperty({
    description: "Is de track gemarkeerd als verwijderd",
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
