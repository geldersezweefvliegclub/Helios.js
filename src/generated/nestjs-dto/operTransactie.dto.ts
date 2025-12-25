import { Prisma } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

export class OperTransactieDto {
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    type: "string",
    format: "date-time",
  })
  DATUM: Date;
  @ApiProperty({
    type: "string",
    format: "date-time",
    nullable: true,
  })
  VLIEGDAG: Date | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  DDWV: number;
  @ApiProperty({
    type: "string",
    format: "Decimal.js",
    nullable: true,
  })
  BEDRAG: Prisma.Decimal | null;
  @ApiProperty({
    type: "string",
    format: "Decimal.js",
    nullable: true,
  })
  EENHEDEN: Prisma.Decimal | null;
  @ApiProperty({
    type: "string",
    format: "Decimal.js",
    nullable: true,
  })
  SALDO_VOOR: Prisma.Decimal | null;
  @ApiProperty({
    type: "string",
    format: "Decimal.js",
    nullable: true,
  })
  SALDO_NA: Prisma.Decimal | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  REFERENTIE: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  EXT_REF: string | null;
  @ApiProperty({
    type: "string",
  })
  OMSCHRIJVING: string;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  BETAALD: number;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  BETAAL_URL: string | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  VERWIJDERD: number;
  @ApiProperty({
    type: "string",
    format: "date-time",
  })
  LAATSTE_AANPASSING: Date;
}
