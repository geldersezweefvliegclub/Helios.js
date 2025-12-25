import { Prisma } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

export class OperAanwezigVliegtuigenDto {
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
  AANKOMST: Date | null;
  @ApiProperty({
    type: "string",
    format: "date-time",
    nullable: true,
  })
  VERTREK: Date | null;
  @ApiProperty({
    type: "string",
    format: "Decimal.js",
    nullable: true,
  })
  LATITUDE: Prisma.Decimal | null;
  @ApiProperty({
    type: "string",
    format: "Decimal.js",
    nullable: true,
  })
  LONGITUDE: Prisma.Decimal | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
    nullable: true,
  })
  HOOGTE: number | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
    nullable: true,
  })
  SNELHEID: number | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
    nullable: true,
  })
  VELD_ID: number | null;
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
