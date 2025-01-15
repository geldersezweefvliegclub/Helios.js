import { ApiProperty } from "@nestjs/swagger";

export class OperJournaalDto {
  @ApiProperty({
    description: "Het unieke ID van het journaal",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description: "Datum van het journaal",
    type: "string",
    format: "date-time",
    nullable: true,
  })
  DATUM: Date | null;
  @ApiProperty({
    description: "Referentie naar het vliegtuig",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  VLIEGTUIG_ID: number | null;
  @ApiProperty({
    description: "Referentie naar het rollend materieel (als type)",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  ROLLEND_ID: number | null;
  @ApiProperty({
    description: "Titel van het journaal",
    maxLength: 75,
    type: "string",
  })
  TITEL: string;
  @ApiProperty({
    description: "Beschrijving van het journaal",
    type: "string",
    nullable: true,
  })
  OMSCHRIJVING: string | null;
  @ApiProperty({
    description: "Referentie naar de categorie",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  CATEGORIE_ID: number | null;
  @ApiProperty({
    description: "Referentie naar de status (type tabel)",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  STATUS_ID: number | null;
  @ApiProperty({
    description: "Referentie naar de melder die journaal heeft aangemaakt",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  MELDER_ID: number | null;
  @ApiProperty({
    description: "Referentie naar de technicus die journaal moet opvolgen",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  TECHNICUS_ID: number | null;
  @ApiProperty({
    description: "Referentie naar wie het heeft afgetekend",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  AFGETEKEND_ID: number | null;
  @ApiProperty({
    description: "Is het journaal gemarkeerd als verwijderd",
    type: "boolean",
  })
  VERWIJDERD: boolean;
  @ApiProperty({
    description: "Datum van de laatste aanpassing",
    type: "string",
    format: "date-time",
  })
  LAATSTE_AANPASSING: Date;
}
