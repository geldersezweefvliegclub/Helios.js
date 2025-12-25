import { ApiProperty } from "@nestjs/swagger";

export class OperRoosterDto {
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
  DDWV: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  CLUB_BEDRIJF: number;
  @ApiProperty({
    type: "boolean",
  })
  WINTER_WERK: boolean;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  MIN_SLEEPSTART: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  MIN_LIERSTART: number;
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
