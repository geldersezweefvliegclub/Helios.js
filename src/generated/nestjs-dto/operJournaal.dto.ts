import { ApiProperty } from "@nestjs/swagger";

export class OperJournaalDto {
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
  TITEL: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  OMSCHRIJVING: string | null;
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
