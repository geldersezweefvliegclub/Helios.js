import { Prisma } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

export class OperFacturenDto {
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  JAAR: number;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  NAAM: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  LIDNR: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  FACTUUR_NUMMER: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  CODE: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  OMSCHRIJVING: string | null;
  @ApiProperty({
    type: "string",
    format: "Decimal.js",
    nullable: true,
  })
  GEFACTUREERD: Prisma.Decimal | null;
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
