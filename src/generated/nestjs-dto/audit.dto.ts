import { ApiProperty } from "@nestjs/swagger";

export class AuditDto {
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
  TABEL: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  TABEL_NAAM: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  ACTIE: string | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
    nullable: true,
  })
  OBJECT_ID: number | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  VOOR: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  DATA: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  RESULTAAT: string | null;
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
