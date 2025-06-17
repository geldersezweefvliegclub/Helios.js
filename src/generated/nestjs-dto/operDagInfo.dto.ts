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
    description: "Referentie naar het veld in de type tabel",
    type: "integer",
    format: "int32",
  })
  VELD_ID: number;
  @ApiProperty({
    description: "Referentie naar de baan in de type tabel",
    type: "integer",
    format: "int32",
  })
  BAAN_ID: number;
  @ApiProperty({
    description: "Referentie naar de startmethode in de type tabel",
    type: "integer",
    format: "int32",
  })
  STARTMETHODE_ID: number;
  @ApiProperty({
    description: "Referentie naar het veld in de type tabel",
    type: "integer",
    format: "int32",
  })
  VELD_ID2: number;
  @ApiProperty({
    description: "Referentie naar de baan in de type tabel",
    type: "integer",
    format: "int32",
  })
  BAAN_ID2: number;
  @ApiProperty({
    description: "Referentie naar de startmethode in de type tabel",
    type: "integer",
    format: "int32",
  })
  STARTMETHODE_ID2: number;
  @ApiProperty({
    description: "Is het een clubbedrijf",
    type: "boolean",
  })
  CLUB_BEDRIJF: boolean;
  @ApiProperty({
    description: "Is het een DDWV bedrijf",
    type: "boolean",
  })
  DDWV: boolean;
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
