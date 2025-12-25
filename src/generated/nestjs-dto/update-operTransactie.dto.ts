import { Prisma } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsDecimal, IsOptional, IsString } from "class-validator";

export class UpdateOperTransactieDto {
  @ApiProperty({
    type: "string",
    format: "date-time",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  VLIEGDAG?: Date | null;
  @ApiProperty({
    type: "string",
    format: "Decimal.js",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDecimal()
  BEDRAG?: Prisma.Decimal | null;
  @ApiProperty({
    type: "string",
    format: "Decimal.js",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDecimal()
  EENHEDEN?: Prisma.Decimal | null;
  @ApiProperty({
    type: "string",
    format: "Decimal.js",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDecimal()
  SALDO_VOOR?: Prisma.Decimal | null;
  @ApiProperty({
    type: "string",
    format: "Decimal.js",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDecimal()
  SALDO_NA?: Prisma.Decimal | null;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  REFERENTIE?: string | null;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  EXT_REF?: string | null;
  @ApiProperty({
    type: "string",
    required: false,
  })
  @IsOptional()
  @IsString()
  OMSCHRIJVING?: string;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  BETAAL_URL?: string | null;
}
