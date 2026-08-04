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

export class UpdateOperFactuurDto {
  @ApiProperty({
    description: "Het unieke ID van een factuur",
    type: "integer",
    format: "int32",
    default: "autoincrement",
    required: false,
  })
  @IsOptional()
  @IsInt()
  ID?: number;
  @ApiProperty({
    description: "Jaar van het lidmaatschap",
    minimum: 2025,
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  JAAR?: number;
  @ApiProperty({
    description:
      "Verwijzing naar het lid ID die de factuur ontvangt, link naar de leden tabel",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  LID_ID?: number | null;
  @ApiProperty({
    description:
      "Het lidnummer zoals dat in de financiele administratie wordt gebruikt",
    maxLength: 10,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  LIDNR?: string | null;
  @ApiProperty({
    description: "Het factuurnummer zoals dat door de boekhouding is toegekend",
    maxLength: 10,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  FACTUUR_NUMMER?: string | null;
  @ApiProperty({
    description: "Lidmaatschapscode",
    maxLength: 10,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  CODE?: string | null;
  @ApiProperty({
    description: "Omschrijving van de factuurregel",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  OMSCHRIJVING?: string | null;
  @ApiProperty({
    description: "Bedrag wat gefactureerd is",
    type: "string",
    format: "Decimal.js",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDecimal()
  GEFACTUREERD?: Prisma.Decimal | null;
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
