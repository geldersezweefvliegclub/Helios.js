import { Prisma } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";
import { IsDecimal, IsInt, IsOptional, IsString } from "class-validator";

export class UpdateRefTypeDto {
  @ApiProperty({
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  GROEP?: number;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  CODE?: string | null;
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
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  SORTEER_VOLGORDE?: number | null;
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
}
