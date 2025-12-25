import { ApiProperty } from "@nestjs/swagger";

export class OperReserveringDto {
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
  INGEVOERD_ID: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  IS_GEBOEKT: number;
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
