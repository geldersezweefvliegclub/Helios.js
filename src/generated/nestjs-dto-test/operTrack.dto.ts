import { ApiProperty } from "@nestjs/swagger";

export class OperTrackDto {
  @ApiProperty({
    description: "Het unieke ID van een track",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description:
      "Verwijzing naar het lid waarover de track gaat, link naar de leden tabel",
    type: "integer",
    format: "int32",
  })
  LID_ID: number;
  @ApiProperty({
    description:
      "Verwijzing naar de instructeur die de track heeft ingevoerd, link naar de leden tabel",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  INSTRUCTEUR_ID: number | null;
  @ApiProperty({
    description: "Omschrijving van de track",
    type: "string",
    nullable: true,
  })
  TEKST: string | null;
  @ApiProperty({
    description: "Verwijzing naar de startlijst waar deze track bij hoort",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  START_ID: number | null;
  @ApiProperty({
    description: "Tijdstempel wanneer de track is ingevoerd",
    type: "string",
    format: "date-time",
    nullable: true,
  })
  INGEVOERD: Date | null;
  @ApiProperty({
    description:
      "De track kan gelinkt zijn aan een andere track (bijv vervolgactie)",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  LINK_ID: number | null;
  @ApiProperty({
    description: "Is de track gemarkeerd als verwijderd",
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
