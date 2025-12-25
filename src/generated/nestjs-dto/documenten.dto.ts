import { ApiProperty } from "@nestjs/swagger";

export class DocumentenDto {
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
  VOLGORDE: number | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  TEKST: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  URL: string | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
    nullable: true,
  })
  LID_ID: number | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  LEGE_REGEL: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  ONDERSTREEP: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  BOVEN: number;
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
