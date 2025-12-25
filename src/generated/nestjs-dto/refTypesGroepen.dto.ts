import { ApiProperty } from "@nestjs/swagger";

export class RefTypesGroepenDto {
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  CODE: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  EXT_REF: string | null;
  @ApiProperty({
    type: "string",
  })
  OMSCHRIJVING: string;
  @ApiProperty({
    type: "integer",
    format: "int32",
    nullable: true,
  })
  SORTEER_VOLGORDE: number | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  READ_ONLY: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  BEDRAG_EENHEDEN: number;
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
