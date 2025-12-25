import { Prisma } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";
import { IsDecimal, IsInt, IsOptional, IsString } from "class-validator";

export class UpdateOperFacturenDto {
  @ApiProperty({
    type: "integer",
    format: "int32",
    required: false,
  })
  @IsOptional()
  @IsInt()
  JAAR?: number;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  NAAM?: string | null;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  LIDNR?: string | null;
  @ApiProperty({
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  FACTUUR_NUMMER?: string | null;
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
  OMSCHRIJVING?: string | null;
  @ApiProperty({
    type: "string",
    format: "Decimal.js",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDecimal()
  GEFACTUREERD?: Prisma.Decimal | null;
}
