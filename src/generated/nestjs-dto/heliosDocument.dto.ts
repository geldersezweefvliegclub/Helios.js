import { ApiProperty } from "@nestjs/swagger";

export class HeliosDocumentDto {
  @ApiProperty({
    description: "Het unieke ID van een document",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description: "Datum wanneer document is aangemaakt",
    type: "string",
    format: "date-time",
  })
  DATUM: Date;
  @ApiProperty({
    description: "Sorteer volgorde",
    minimum: 0,
    type: "integer",
    format: "int32",
    nullable: true,
  })
  VOLGORDE: number | null;
  @ApiProperty({
    description: "Documenten worden gegroepeerd",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  GROEP_ID: number | null;
  @ApiProperty({
    description: "Beschrijving van het document",
    minLength: 4,
    type: "string",
    nullable: true,
  })
  TEKST: string | null;
  @ApiProperty({
    description: "Link naar het document",
    type: "string",
    nullable: true,
  })
  URL: string | null;
  @ApiProperty({
    description: "Document behoort bij een lid, bijv kopie medical, brevet",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  LID_ID: number | null;
  @ApiProperty({
    description: "Lege regel om paragraaf te kunnen maken",
    type: "boolean",
  })
  LEGE_REGEL: boolean;
  @ApiProperty({
    description: "Plaats een horizontale lijn",
    type: "boolean",
  })
  ONDERSTREEP: boolean;
  @ApiProperty({
    description:
      "Plaats een horizontale lijn aan de bovenkant (true) / onderkant (false)",
    type: "boolean",
  })
  BOVEN: boolean;
  @ApiProperty({
    description: "Is het record gemarkeerd als verwijderd",
    type: "boolean",
  })
  VERWIJDERD: boolean;
  @ApiProperty({
    description: "Tijdstempel met de laatste wijziging van het record",
    type: "string",
    format: "date-time",
  })
  LAATSTE_AANPASSING: Date;
}
