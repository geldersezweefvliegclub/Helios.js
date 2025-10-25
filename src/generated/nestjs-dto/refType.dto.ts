import { ApiProperty } from "@nestjs/swagger";
import {RefType} from "@prisma/client";

export class RefTypeDto {
  /**
   * Creates an instance of OperDienstDto, from a OperDienst model object from Primsa.
   * If you get an error when instantiating this class after quering using Primsa, make sure you included all necessary relations in your Prisma query!
   */
  constructor(obj?: RefType) {
    this.ID = obj?.ID;
    this.GROEP = obj?.TYPEGROEP_ID;
    this.CODE = obj?.CODE;
    this.EXT_REF = obj?.EXT_REF;
    this.OMSCHRIJVING = obj?.OMSCHRIJVING;
    this.SORTEER_VOLGORDE = obj?.SORTEER_VOLGORDE;
    this.READ_ONLY = obj?.READ_ONLY;
    this.BEDRAG = obj?.BEDRAG;
    this.EENHEDEN = obj?.EENHEDEN;
    this.VERWIJDERD = obj?.VERWIJDERD;
    this.LAATSTE_AANPASSING = obj?.LAATSTE_AANPASSING;
  }

  @ApiProperty({
    description:
      "De primary ID van het type, andere objecten refereren naar dit ID",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description: "Verwijzing naar de RefTypesGroepen",
    type: "integer",
    format: "int32",
  })
  GROEP: number;
  @ApiProperty({
    description: "De code van dit type",
    maxLength: 10,
    type: "string",
    nullable: true,
  })
  CODE: string | null;
  @ApiProperty({
    description: "De externe referentie van dit type",
    maxLength: 25,
    type: "string",
    nullable: true,
  })
  EXT_REF: string | null;
  @ApiProperty({
    description: "De omschrijving van de groep",
    maxLength: 75,
    type: "string",
  })
  OMSCHRIJVING: string;
  @ApiProperty({
    type: "integer",
    format: "int32",
    nullable: true,
  })
  SORTEER_VOLGORDE: number | null;
  @ApiProperty({
    description:
      "Is dit type readonly. Indien readonly kan het record niet worden aangepast vanwege harde verwijzing in de source code",
    type: "boolean",
  })
  READ_ONLY: boolean;
  @ApiProperty({
    description: "Het bedrag om te kunnen factureren",
    type: "number",
    format: "float",
    nullable: true,
  })
  BEDRAG: number | null;
  @ApiProperty({
    description: "De eenheden om te kunnen boeken, bijvoorbeeld DDWV strippen",
    type: "number",
    format: "float",
    nullable: true,
  })
  EENHEDEN: number | null;
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
