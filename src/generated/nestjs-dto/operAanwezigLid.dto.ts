import { ApiProperty } from "@nestjs/swagger";

export class OperAanwezigLidDto {
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
    description:
      "Verwijzing naar het lid ID van de vlieger, link naar de leden tabel",
    type: "integer",
    format: "int32",
  })
  LID_ID: number;
  @ApiProperty({
    description: "Referentie naar het vliegveld in de type tabel",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  VELD_ID: number | null;
  @ApiProperty({
    description:
      "Is er vooraf aangemeld (true)? Of is de aanmelding gedaan bij het starten van de vlucht (false)?",
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
