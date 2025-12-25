import { ApiProperty } from "@nestjs/swagger";

export class OperAanwezigLidDto {
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
  POSITIE: number | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  VOORAANMELDING: number;
  @ApiProperty({
    type: "string",
    format: "date-time",
    nullable: true,
  })
  AANKOMST: Date | null;
  @ApiProperty({
    type: "string",
    format: "date-time",
    nullable: true,
  })
  VERTREK: Date | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  VOORKEUR_VLIEGTUIG_TYPE: string | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
    nullable: true,
  })
  VELD_ID: number | null;
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
