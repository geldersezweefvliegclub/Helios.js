import { ApiProperty } from "@nestjs/swagger";

export class OperDagRapportDto {
  @ApiProperty({
    description: "Het unieke ID van een dagrapport",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description: "Datum van het dagrapport",
    type: "string",
    format: "date-time",
  })
  DATUM: Date;
  @ApiProperty({
    description: "Referentie naar het vliegveld in de type tabel",
    type: "integer",
    format: "int32",
  })
  VELD_ID: number;
  @ApiProperty({
    description:
      "Verwijzing naar het lid ID van de instructeur die rapport geschreven heeft, link naar de leden tabel",
    type: "integer",
    format: "int32",
  })
  INGEVOERD_ID: number;
  @ApiProperty({
    description: "Beschrijving van de incidenten",
    type: "string",
    nullable: true,
  })
  INCIDENTEN: string | null;
  @ApiProperty({
    description: "Weersinformatie",
    type: "string",
    nullable: true,
  })
  METEO: string | null;
  @ApiProperty({
    description:
      "Diegene die dienst hebben gedaan, startleider, DDI, lierist etc",
    type: "string",
    nullable: true,
  })
  DIENSTEN: string | null;
  @ApiProperty({
    description: "Algemeen verslag van het vliegbedrijf",
    type: "string",
    nullable: true,
  })
  VERSLAG: string | null;
  @ApiProperty({
    description: "Bijzonderheden over rollend materieel",
    type: "string",
    nullable: true,
  })
  ROLLENDMATERIEEL: string | null;
  @ApiProperty({
    description: "Bijzonderheden over de ingezette vliegtuigen",
    type: "string",
    nullable: true,
  })
  VLIEGENDMATERIEEL: string | null;
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
