import { ApiProperty } from "@nestjs/swagger";

export class OperWinterwerkDto {
  @ApiProperty({
    description: "Het unieke ID van een agenda-item",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description: "Datum van de werkdag",
    type: "string",
    format: "date-time",
  })
  DATUM: Date;
  @ApiProperty({
    description: "Begin van de werkzaamheden",
    type: "string",
    format: "date-time",
  })
  AANVANG: Date;
  @ApiProperty({
    description: "Einde van de werkzaamheden",
    type: "string",
    format: "date-time",
  })
  EINDE: Date;
  @ApiProperty({
    description: "Eventuele opmerkingen",
    type: "string",
    nullable: true,
  })
  OPMERKINGEN: string | null;
  @ApiProperty({
    description:
      "Verwijzing naar het lid ID van de persoon die gewerkt heeft, link naar de leden tabel",
    type: "integer",
    format: "int32",
  })
  LID_ID: number;
  @ApiProperty({
    description: "Is het agenda-item gemarkeerd als verwijderd",
    type: "boolean",
  })
  VERWIJDERD: boolean;
  @ApiProperty({
    description: "Laatste aanpassingstijd van het winterwerk-item",
    type: "string",
    format: "date-time",
  })
  LAATSTE_AANPASSING: Date;
}
