import { ApiProperty } from "@nestjs/swagger";

export class RefVliegtuigDto {
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
    description: "Is de groep gemarkeerd als verwijderd",
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
