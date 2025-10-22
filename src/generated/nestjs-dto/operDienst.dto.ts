import { ApiProperty } from "@nestjs/swagger";
import {OperDienst, RefType} from "@prisma/client";

export class OperDienstDto {
  /**
   * Creates an instance of OperDienstDto, from a OperDienst model object from Primsa.
   * If you get an error when instantiating this class after quering using Primsa, make sure you included all necessary relations in your Prisma query!
   * @param dienst
   */
  constructor(dienst?: OperDienst & { TypeDienst: RefType }) {
    this.ID = dienst?.ID;
    this.DATUM = dienst?.DATUM;
    this.LID_ID = dienst?.LID_ID;
    this.ROOSTER_ID = dienst?.ROOSTER_ID;
    this.TYPE_DIENST_ID = dienst?.TYPE_DIENST_ID;
    this.TYPE_DIENST = dienst?.TypeDienst?.OMSCHRIJVING;
    this.INGEVOERD_DOOR_ID = dienst?.INGEVOERD_DOOR_ID;
    this.UITBETAALD = dienst?.UITBETAALD;
    this.OPMERKINGEN = dienst?.OPMERKINGEN;
    this.VERWIJDERD = dienst?.VERWIJDERD;
    this.LAATSTE_AANPASSING = dienst?.LAATSTE_AANPASSING;
  }

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
    description:
      "Verwijzing naar het lid ID van diegene die ingeroosterd is, link naar de leden tabel",
    type: "integer",
    format: "int32",
  })
  LID_ID: number;
  @ApiProperty({
    description: "Referentie naar het rooster",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  ROOSTER_ID: number | null;
  @ApiProperty({
    description:
      "ID (integer) van het type dienst (startleider, DDI, lietrist, etc)",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  TYPE_DIENST_ID: number | null;

  @ApiProperty({
    description:
        "Omschrijving van het type dienst (startleider, DDI, lietrist, etc)",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  TYPE_DIENST: string | null;

  @ApiProperty({
    description:
      "Verwijzing naar het lid ID van de instructeur die rapport geschreven heeft, link naar de leden tabel",
    type: "integer",
    format: "int32",
  })
  INGEVOERD_DOOR_ID: number;
  @ApiProperty({
    description: "Is de DDWV dienst uitbetaald?",
    type: "boolean",
  })
  UITBETAALD: boolean;
  @ApiProperty({
    description: "Opmerkingen die bij de gast horen",
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
