import { ApiProperty } from "@nestjs/swagger";
import {RefCompetentie, RefType, RefVliegtuig} from "@prisma/client";

export class RefVliegtuigDto {
  /**
   * Creates an instance of RefVliegtuigDto, from a RefVliegtuig model object from Prisma.
   * If you get an error when instantiating this class after querying using Prisma, make sure you included all necessary relations in your Prisma query!
   */
  constructor(obj?: RefVliegtuig & {
      VliegtuigType?: RefType,
      BevoegdheidLokaal?: RefCompetentie,
      BevoegdheidOverland?: RefCompetentie
  } ) {
    this.ID = obj?.ID;
    this.REGISTRATIE = obj?.REGISTRATIE;
    this.CALLSIGN = obj?.CALLSIGN;
    this.ZITPLAATSEN = obj?.ZITPLAATSEN;
    this.CLUBKIST = obj?.CLUBKIST;
    this.FLARMCODE = obj?.FLARMCODE;
    this.TYPE_ID = obj?.TYPE_ID;
    this.ZELFSTART = obj?.ZELFSTART;
    this.TMG = obj?.TMG;
    this.SLEEPKIST = obj?.SLEEPKIST;
    this.INZETBAAR = obj?.INZETBAAR;
    this.VOLGORDE = obj?.VOLGORDE;
    this.TRAINER = obj?.TRAINER;
    this.URL = obj?.URL;
    this.OPMERKINGEN = obj?.OPMERKINGEN;
    this.VERWIJDERD = obj?.VERWIJDERD;
    this.LAATSTE_AANPASSING = obj?.LAATSTE_AANPASSING;

    this.VLIEGTUIGTYPE = obj?.VliegtuigType?.OMSCHRIJVING;
    this.BEVOEGDHEID_LOKAAL = obj?.BevoegdheidLokaal?.OMSCHRIJVING;
    this.BEVOEGDHEID_OVERLAND = obj?.BevoegdheidOverland?.OMSCHRIJVING;
  }




  @ApiProperty({
    description:
      "De primary ID van het vliegtuig, andere objecten refereren naar dit ID",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description: "Registratie van het vliegtuig",
    minLength: 4,
    maxLength: 8,
    type: "string",
  })
  REGISTRATIE: string;
  @ApiProperty({
    description: "Callsign van het vliegtuig",
    maxLength: 6,
    type: "string",
    nullable: true,
  })
  CALLSIGN: string | null;
  @ApiProperty({
    description: "Aantal zitplaatsen in het vliegtuig",
    minimum: 1,
    maximum: 2,
    type: "integer",
    format: "int32",
  })
  ZITPLAATSEN: number;
  @ApiProperty({
    description: "Is het vliegtuig eigendom van de club",
    type: "boolean",
  })
  CLUBKIST: boolean;
  @ApiProperty({
    description:
      "Flarmcode van het vliegtuig. Indien meerdere codes, dan CSV met comma's als scheidingsteken",
    maxLength: 50,
    type: "string",
    nullable: true,
  })
  FLARMCODE: string | null;
  @ApiProperty({
    description: "Het type vliegtuig, relatie naar de types tabel",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  TYPE_ID: number | null;
  @ApiProperty({
    description: "Kan het vliegtuig zelfstarten",
    type: "boolean",
  })
  ZELFSTART: boolean;
  @ApiProperty({
    description: "Is het een Touring Motor Glider (TMG)",
    type: "boolean",
  })
  TMG: boolean;
  @ApiProperty({
    description: "Is het een motorvliegtuig die sleept",
    type: "boolean",
  })
  SLEEPKIST: boolean;
  @ApiProperty({
    description: "Is het vliegtuig inzetbaar in het vliegbedrijf",
    type: "boolean",
  })
  INZETBAAR: boolean;
  @ApiProperty({
    description: "Sorteer volgorde",
    minimum: 0,
    type: "integer",
    format: "int32",
    nullable: true,
  })
  VOLGORDE: number | null;
  @ApiProperty({
    description: "Is het vliegtuig een instructievliegtuig",
    type: "boolean",
  })
  TRAINER: boolean;
  @ApiProperty({
    description: "De URL naar de handleiding van het vliegtuig",
    maxLength: 1024,
    type: "string",
    nullable: true,
  })
  URL: string | null;
  @ApiProperty({
    description: "Opmerkingen over het vliegtuig",
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

  // hier komen de specifieke velden voor GetObjects

  @ApiProperty({
    type: String,
    required: true,
    description: 'Omschrijving van het vliegtuig type',
  })
  VLIEGTUIGTYPE?: string

  @ApiProperty({
    type: String,
    required: false,
    description: 'Omschrijving om vliegtuig lokaal te mogen vliegen',
  })
  BEVOEGDHEID_LOKAAL?: string

  @ApiProperty({
    type: String,
    required: false,
    description: 'Omschrijving om met vliegtuig overland te gaan',
  })
  BEVOEGDHEID_OVERLAND?: string

  @ApiProperty({
    type: Number,
    required: false,      //TODO: moet true worden als journaal aanwezig is
    description: 'Aantal uitstaande journaals',
  })
  JOURNAAL_AANTAL?: number
}
