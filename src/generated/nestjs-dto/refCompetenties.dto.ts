import { ApiProperty } from "@nestjs/swagger";

export class RefCompetentiesDto {
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
    nullable: true,
  })
  VOLGORDE: number | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  BLOK: string | null;
  @ApiProperty({
    type: "string",
  })
  ONDERWERP: string;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  DOCUMENTATIE: string | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  GELDIGHEID: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  SCORE: number;
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
