import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class UpdateOperTransactieDto {
  @ApiProperty({
    description: "Het unieke ID van de transactie",
    type: "integer",
    format: "int32",
    default: "autoincrement",
    required: false,
  })
  @IsOptional()
  @IsInt()
  ID?: number;
  @ApiProperty({
    description: "Datum van het dagrapport",
    type: "string",
    format: "date-time",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  DATUM?: Date;
  @ApiProperty({
    description:
      "Transactie heeft betrekking op een DDWV vliegdag, dit is de datum van de vliegdag",
    type: "string",
    format: "date-time",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  VLIEGDAG?: Date | null;
  @ApiProperty({
    description:
      "Verwijzing naar het lid ID van de vlieger, link naar de leden tabel",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  LID_ID?: number;
  @ApiProperty({
    description:
      "Verwijzing naar het lid ID van de persoon die de transactie heeft aangemaakt, link naar de leden tabel",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  INGEVOERD_ID?: number;
  @ApiProperty({
    description:
      "Referentie naar het type van de transactie, link naar type tabel",
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  TYPE_ID?: number;
  @ApiProperty({
    description: "Gaat het hier om een DDWV transactie?",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  DDWV?: boolean;
  @ApiProperty({
    description: "Het bedrag wat gefactureerd wordt per eeinheid",
    type: "number",
    format: "float",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  BEDRAG?: number | null;
  @ApiProperty({
    description:
      "De eenheden om te kunnen boeken, bijvoorbeeld aantal lierstarts, of aantal strippen",
    type: "number",
    format: "float",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  EENHEDEN?: number | null;
  @ApiProperty({
    description: "Aantal strippen voordat de transcatie verwerkt is.",
    type: "number",
    format: "float",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  SALDO_VOOR?: number | null;
  @ApiProperty({
    description: "Aantal strippen NA de transactie, dus het nieuwe saldo",
    type: "number",
    format: "float",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  SALDO_NA?: number | null;
  @ApiProperty({
    description:
      "Referentie naar een extern system, bijv Mollie of e-boekhouden",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  EXT_REF?: string | null;
  @ApiProperty({
    description: "Eventuele opmerkingen, zoals eerder weg gaan",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  OMSCHRIJVING?: string | null;
}
