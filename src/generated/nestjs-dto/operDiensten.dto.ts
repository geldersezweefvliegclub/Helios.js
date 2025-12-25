import { ApiProperty } from "@nestjs/swagger";

export class OperDienstenDto {
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
    nullable: true,
  })
  AANWEZIG: number | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  UITBETAALD: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
    nullable: true,
  })
  AFWEZIG: number | null;
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
