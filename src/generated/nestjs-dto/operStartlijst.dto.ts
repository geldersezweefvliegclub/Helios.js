import { ApiProperty } from "@nestjs/swagger";

export class OperStartlijstDto {
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
    type: "integer",
    format: "int32",
  })
  DAGNUMMER: number;
  @ApiProperty({
    type: "string",
    format: "date-time",
    nullable: true,
  })
  STARTTIJD: Date | null;
  @ApiProperty({
    type: "string",
    format: "date-time",
    nullable: true,
  })
  LANDINGSTIJD: Date | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  VLIEGERNAAM: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  INZITTENDENAAM: string | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
    nullable: true,
  })
  SLEEP_HOOGTE: number | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  OPMERKINGEN: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  EXTERNAL_ID: string | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  PAX: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  CHECKSTART: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  INSTRUCTIEVLUCHT: number;
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
