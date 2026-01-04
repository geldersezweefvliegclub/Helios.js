import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, IsOptional, IsString } from "class-validator";

export class CreateOperTrackDto {
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
    nullable: true,
  })
  @IsOptional()
  @IsString()
  TEKST?: string | null;
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
    description:
      "De track kan gelinkt zijn aan een andere track (bijv vervolgactie)",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  LINK_ID?: number | null;
}
