import { Prisma } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsDecimal,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateOperTransactieDto {
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
  })
  @IsNotEmpty()
  @IsString()
  OMSCHRIJVING: string;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  BETAAL_URL?: string | null;
}
