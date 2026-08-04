import { Prisma } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsDecimal,
  IsInt,
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
    description: "Het bedrag wat gefactureerd wordt per eenheid",
    type: "string",
    format: "Decimal.js",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDecimal()
  BEDRAG?: Prisma.Decimal | null;
  @ApiProperty({
    description:
      "De eenheden om te kunnen boeken, bijvoorbeeld aantal lierstarts, of aantal strippen",
    type: "string",
    format: "Decimal.js",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDecimal()
  EENHEDEN?: Prisma.Decimal | null;
  @ApiProperty({
    description: "Aantal strippen voordat de transcatie verwerkt is.",
    type: "string",
    format: "Decimal.js",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDecimal()
  SALDO_VOOR?: Prisma.Decimal | null;
  @ApiProperty({
    description: "Aantal strippen NA de transactie, dus het nieuwe saldo",
    type: "string",
    format: "Decimal.js",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDecimal()
  SALDO_NA?: Prisma.Decimal | null;
  @ApiProperty({
    description: "Response van een extern systeem bijv Mollie of e-boekhouden",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  REFERENTIE?: string | null;
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
    description: "Omschrijving van de transactie, komt zo ook op de factuur",
    type: "string",
    required: false,
  })
  @IsOptional()
  @IsString()
  OMSCHRIJVING?: string;
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
