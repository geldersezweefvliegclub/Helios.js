import { ApiProperty } from "@nestjs/swagger";

export class OperProgressieDto {
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  OPMERKINGEN: string | null;
  @ApiProperty({
    type: "string",
    format: "date-time",
    nullable: true,
  })
  INGEVOERD: Date | null;
  @ApiProperty({
    type: "string",
    format: "date-time",
    nullable: true,
  })
  GELDIG_TOT: Date | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
    nullable: true,
  })
  SCORE: number | null;
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
