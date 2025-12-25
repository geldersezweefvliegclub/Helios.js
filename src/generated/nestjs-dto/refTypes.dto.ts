import { Prisma } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

export class RefTypesDto {
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  GROEP: number;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  CODE: string | null;
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
    nullable: true,
  })
  SORTEER_VOLGORDE: number | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  READ_ONLY: number;
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
