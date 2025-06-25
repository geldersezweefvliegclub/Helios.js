import { ApiProperty } from "@nestjs/swagger";

export class OperDagInfoDto {
  @ApiProperty({
    description: "Het unieke ID van de daginfo",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description: "Datum van de daginfo",
    type: "string",
    format: "date-time",
    nullable: true,
  })
  DATUM: Date | null;
  @ApiProperty({
    description: "Referentie naar het vliegveld in de type tabel",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  VELD_ID: number | null;
  @ApiProperty({
    description: "Referentie naar de baan in de type tabel",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  BAAN_ID: number | null;
  @ApiProperty({
    description: "Referentie naar de startmethode in de type tabel",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  STARTMETHODE_ID: number | null;
  @ApiProperty({
    description:
      "Referentie naar het vliegveld in de type tabel, bijv voor (buitenland)kamp",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  VELD_ID2: number | null;
  @ApiProperty({
    description: "Referentie naar de baan in de type tabel",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  BAAN_ID2: number | null;
  @ApiProperty({
    description: "Referentie naar de startmethode in de type tabel",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  STARTMETHODE_ID2: number | null;
  @ApiProperty({
    description: "Is het een clubbedrijf op het primaire veld",
    type: "boolean",
  })
  CLUB_BEDRIJF: boolean;
  @ApiProperty({
    description: "Is het een DDWV bedrijf op het primaire veld",
    type: "boolean",
  })
  DDWV: boolean;
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
