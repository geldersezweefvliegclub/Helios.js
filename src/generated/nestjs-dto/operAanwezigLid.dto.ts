import { ApiProperty } from "@nestjs/swagger";

export class OperAanwezigLidDto {
  @ApiProperty({
    description: "Het unieke ID van de aanmelding",
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
    description:
      "Verwijzing naar het lid ID van de persoon die gewerkt heeft, link naar de leden tabel",
    type: "integer",
    format: "int32",
  })
  LID_ID: number;
  @ApiProperty({
    description: "Referentie naar het veld in de type tabel",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  VELD_ID: number | null;
  @ApiProperty({
    description:
      "Is er vooraf aangemeld? Of is de aanmelding gedaan bij het starten van de vlucht?",
    type: "boolean",
  })
  VOORAANMELDING: boolean;
  @ApiProperty({
    description: "Tijd van aanwezig zijn (niet de tijd van de aanmelding)",
    type: "string",
    format: "date-time",
    nullable: true,
  })
  AANKOMST: Date | null;
  @ApiProperty({
    description: "Vertrek tijd, de tijd dat de persoon vertrekt van het veld",
    type: "string",
    format: "date-time",
    nullable: true,
  })
  VERTREK: Date | null;
  @ApiProperty({
    description: "Referentie naar het veld in de type tabel",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  OVERLAND_VLIEGTUIG_ID: number | null;
  @ApiProperty({
    description:
      "Comma-separated lijst van de vliegtuigen types waarop het lid graag wil vliegen",
    type: "string",
    nullable: true,
  })
  VOORKEUR_VLIEGTUIG_TYPE: string | null;
  @ApiProperty({
    description:
      "Referentie naar de transactie als dat van toepassing is (bijv DDVD)",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  TRANSACTIE_ID: number | null;
  @ApiProperty({
    description: "Eventuele opmerkingen, zoals eerder weg gaan",
    type: "string",
    nullable: true,
  })
  OPMERKINGEN: string | null;
  @ApiProperty({
    description: "Is het dagrapport gemarkeerd als verwijderd",
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
