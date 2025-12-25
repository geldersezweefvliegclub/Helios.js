import { ApiProperty } from "@nestjs/swagger";

export class OperTrackDto {
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  TEKST: string | null;
  @ApiProperty({
    type: "string",
    format: "date-time",
    nullable: true,
  })
  INGEVOERD: Date | null;
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
