import { ApiProperty } from "@nestjs/swagger";

export class OperDaginfoDto {
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
    nullable: true,
  })
  INCIDENTEN: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  VLIEGBEDRIJF: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  METEO: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  DIENSTEN: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  VERSLAG: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  ROLLENDMATERIEEL: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  VLIEGENDMATERIEEL: string | null;
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
