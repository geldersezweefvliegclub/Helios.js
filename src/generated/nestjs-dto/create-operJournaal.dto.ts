import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateOperJournaalDto {
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
    default: new Date().toISOString(),
    required: false,
  })
  @IsOptional()
  @IsDateString()
  DATUM?: Date;
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
    type: "string",
  })
  @IsNotEmpty()
  @IsString()
  TITEL: string;
  @ApiProperty({
    description: "Beschrijving van het journaal",
    type: "string",
  })
  @IsNotEmpty()
  @IsString()
  OMSCHRIJVING: string;
  @ApiProperty({
    description: "Referentie naar de categorie defect, observatie, klacht",
    type: "integer",
    format: "int32",
  })
  @IsNotEmpty()
  @IsInt()
  CATEGORIE_ID: number;
  @ApiProperty({
    description:
      "Referentie naar de status (type tabel), standaard JournaalStatus.Gemeld als niet meegegeven",
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
