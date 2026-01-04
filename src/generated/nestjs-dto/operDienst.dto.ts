import { ApiProperty } from "@nestjs/swagger";

export class OperDienstDto {
  @ApiProperty({
    description: "Het unieke ID van de dienst",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description: "Datum van de daginfo",
    type: "string",
    format: "date-time",
  })
  DATUM: Date;
  @ApiProperty({
    description: "Referentie naar het rooster",
    type: "integer",
    format: "int32",
  })
  ROOSTER_ID: number;
  @ApiProperty({
    description:
      "Verwijzing naar het lid ID van diegene die ingeroosterd is, link naar de leden tabel",
    type: "integer",
    format: "int32",
  })
  LID_ID: number;
  @ApiProperty({
    description:
      "Referentie naar hettype dienst (startleider, DDI, lietrist, etc)",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  TYPE_DIENST_ID: number | null;
  @ApiProperty({
    description:
      "Verwijzing naar het lid ID van de instructeur die rapport geschreven heeft, link naar de leden tabel",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  INGEVOERD_DOOR_ID: number | null;
  @ApiProperty({
    description: "True als het lid aanwezig was tijdens deze dienst",
    type: "boolean",
    nullable: true,
  })
  AANWEZIG: boolean | null;
  @ApiProperty({
    description: "Is de DDWV dienst uitbetaald?",
    type: "boolean",
  })
  UITBETAALD: boolean;
  @ApiProperty({
    description: "True als het lid afwezig was tijdens deze dienst",
    type: "boolean",
    nullable: true,
  })
  AFWEZIG: boolean | null;
  @ApiProperty({
    description: "Is het record gemarkeerd als verwijderd",
    type: "boolean",
  })
  VERWIJDERD: boolean;
  @ApiProperty({
    type: "string",
    format: "date-time",
  })
  LAATSTE_AANPASSING: Date;
}
