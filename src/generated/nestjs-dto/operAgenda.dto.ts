import { ApiProperty } from "@nestjs/swagger";

export class OperAgendaDto {
  @ApiProperty({
    description: "Het unieke ID van een agenda-item",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description: "Datum van het agenda-item",
    type: "string",
    format: "date-time",
  })
  DATUM: Date;
  @ApiProperty({
    description: "Korte beschrijving van het agenda-item",
    maxLength: 255,
    type: "string",
    nullable: true,
  })
  KORT: string | null;
  @ApiProperty({
    description: "Gedetailleerde beschrijving van het agenda-item",
    type: "string",
    nullable: true,
  })
  OMSCHRIJVING: string | null;
  @ApiProperty({
    description: "Is het agenda-item openbaar",
    type: "boolean",
  })
  OPENBAAR: boolean;
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
