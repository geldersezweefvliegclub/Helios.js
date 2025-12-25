import { Prisma } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsDecimal,
  IsInt,
  IsNotEmpty,
  IsOptional,
} from "class-validator";

export class CreateOperAanwezigVliegtuigDto {
  @ApiProperty({
    type: "string",
    format: "date-time",
  })
  @IsNotEmpty()
  @IsDateString()
  DATUM: Date;
  @ApiProperty({
    type: "string",
    format: "date-time",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  AANKOMST?: Date | null;
  @ApiProperty({
    type: "string",
    format: "date-time",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  VERTREK?: Date | null;
  @ApiProperty({
    type: "string",
    format: "Decimal.js",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDecimal()
  LATITUDE?: Prisma.Decimal | null;
  @ApiProperty({
    type: "string",
    format: "Decimal.js",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDecimal()
  LONGITUDE?: Prisma.Decimal | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  HOOGTE?: number | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  SNELHEID?: number | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  VELD_ID?: number | null;
}
