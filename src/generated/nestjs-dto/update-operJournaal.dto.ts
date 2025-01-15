import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, IsOptional, IsString } from "class-validator";

export class UpdateOperJournaalDto {
  @ApiProperty({
    description: "Het unieke ID van het journaal",
    type: "integer",
    format: "int32",
    default: "autoincrement",
    required: false,
  })
  @IsOptional()
  @IsInt()
  ID?: number;
  @ApiProperty({
    description: "Datum van het journaal",
    type: "string",
    format: "date-time",
    default: "now",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  DATUM?: Date | null;
  @ApiProperty({
    description: "Referentie naar het vliegtuig",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  VLIEGTUIG_ID?: number | null;
  @ApiProperty({
    description: "Referentie naar het rollend materieel (als type)",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  ROLLEND_ID?: number | null;
  @ApiProperty({
    description: "Titel van het journaal",
    maxLength: 75,
    type: "string",
    required: false,
  })
  @IsOptional()
  @IsString()
  TITEL?: string;
  @ApiProperty({
    description: "Beschrijving van het journaal",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  OMSCHRIJVING?: string | null;
  @ApiProperty({
    description: "Referentie naar de categorie",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  CATEGORIE_ID?: number | null;
  @ApiProperty({
    description: "Referentie naar de status (type tabel)",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  STATUS_ID?: number | null;
  @ApiProperty({
    description: "Referentie naar de melder die journaal heeft aangemaakt",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  MELDER_ID?: number | null;
  @ApiProperty({
    description: "Referentie naar de technicus die journaal moet opvolgen",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  TECHNICUS_ID?: number | null;
  @ApiProperty({
    description: "Referentie naar wie het heeft afgetekend",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  AFGETEKEND_ID?: number | null;
}
