import { ApiProperty } from "@nestjs/swagger";

export class RefVliegtuigDto {
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    type: "string",
  })
  REGISTRATIE: string;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  CALLSIGN: string | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  ZITPLAATSEN: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  CLUBKIST: number;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  FLARMCODE: string | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  TMG: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  ZELFSTART: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  SLEEPKIST: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
    nullable: true,
  })
  VOLGORDE: number | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  INZETBAAR: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  TRAINER: number;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  URL: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  OPMERKINGEN: string | null;
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
