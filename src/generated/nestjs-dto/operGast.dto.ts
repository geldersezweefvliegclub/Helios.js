import { ApiProperty } from "@nestjs/swagger";

export class OperGastDto {
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    type: "string",
  })
  NAAM: string;
  @ApiProperty({
    type: "string",
    format: "date-time",
  })
  DATUM: Date;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  OPMERKINGEN: string | null;
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
