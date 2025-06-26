import { ApiProperty } from "@nestjs/swagger";

export class OperAanwezigVliegtuigDto {
  @ApiProperty({
    description: "Het unieke ID van de aanmelding",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description: "Datum van de aanmelding",
    type: "string",
    format: "date-time",
  })
  DATUM: Date;
  @ApiProperty({
    description: "Referentie naar het vliegveld in de type tabel",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  VELD_ID: number | null;
  @ApiProperty({
    description: "Tijd van aanwezig zijn (niet de tijd van de aanmelding)",
    type: "string",
    format: "date-time",
    nullable: true,
  })
  AANKOMST: Date | null;
  @ApiProperty({
    description:
      "Vertrek tijd, de tijd dat de persoon vertrekt van het veld en naar huis gaat",
    type: "string",
    format: "date-time",
    nullable: true,
  })
  VERTREK: Date | null;
  @ApiProperty({
    description: "Referentie naar het vliegtuig in de vliegtuigen tabel",
    type: "integer",
    format: "int32",
  })
  VLIEGTUIG_ID: number;
  @ApiProperty({
    description: "Laaste bekende Latitude van het vliegtuig",
    type: "number",
    format: "float",
    nullable: true,
  })
  LATITUDE: number | null;
  @ApiProperty({
    description: "Laaste bekende Longitude van het vliegtuig",
    type: "number",
    format: "float",
    nullable: true,
  })
  LONGITUDE: number | null;
  @ApiProperty({
    description: "Laaste bekende hoogte van het vliegtuig in meters",
    type: "number",
    format: "float",
    nullable: true,
  })
  HOOGTE: number | null;
  @ApiProperty({
    description: "Laaste bekende grond snelheid van het vliegtuig in km/h",
    type: "number",
    format: "float",
    nullable: true,
  })
  SNELHEID: number | null;
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
