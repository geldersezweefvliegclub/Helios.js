import { ApiProperty } from "@nestjs/swagger";

export class OperStartlijstDto {
  @ApiProperty({
    description: "Het unieke ID van het startlijst record",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description: "De datum van de vlucht",
    type: "string",
    format: "date-time",
  })
  DATUM: Date;
  @ApiProperty({
    description:
      "Het volgnummer van de vlucht op die dag. Begint bij 1 voor de eerste vlucht van die dag.",
    type: "integer",
    format: "int32",
  })
  DAGNUMMER: number;
  @ApiProperty({
    description: "Het vliegtuig dat gebruikt is voor de vlucht",
    type: "integer",
    format: "int32",
  })
  VLIEGTUIG_ID: number;
  @ApiProperty({
    description: "De starttijd van de vlucht",
    type: "string",
    format: "date-time",
    nullable: true,
  })
  STARTTIJD: Date | null;
  @ApiProperty({
    description: "De landingtijd van de vlucht",
    type: "string",
    format: "date-time",
    nullable: true,
  })
  LANDINGSTIJD: Date | null;
  @ApiProperty({
    description: "De startmethode die gebruikt is voor de vlucht",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  STARTMETHODE_ID: number | null;
  @ApiProperty({
    description: "De piloot die de vlucht heeft uitgevoerd",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  VLIEGER_ID: number | null;
  @ApiProperty({
    description: "De inzittende die meegevlogen heeft",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  INZITTENDE_ID: number | null;
  @ApiProperty({
    description:
      "Naam van de vlieger op het moment van de vlucht (voor historische doeleinden)",
    type: "string",
    nullable: true,
  })
  VLIEGERNAAM: string | null;
  @ApiProperty({
    description:
      "Naam van de inzittende op het moment van de vlucht (voor historische doeleinden)",
    type: "string",
    nullable: true,
  })
  INZITTENDENAAM: string | null;
  @ApiProperty({
    description: "Het sleepvliegtuig dat gebruikt is voor de vlucht",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  SLEEPKIST_ID: number | null;
  @ApiProperty({
    description: "De hoogte waarop is losgekoppeld tijdens de sleep",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  SLEEP_HOOGTE: number | null;
  @ApiProperty({
    description: "Het veld van waaruit is gestart",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  VELD_ID: number | null;
  @ApiProperty({
    description: "De baan waarop is gestart",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  BAAN_ID: number | null;
  @ApiProperty({
    description: "Eventuele opmerkingen bij de vlucht",
    type: "string",
    nullable: true,
  })
  OPMERKINGEN: string | null;
  @ApiProperty({
    description: "Externe referentie ID voor koppelingen met externe systemen",
    type: "string",
    nullable: true,
  })
  EXTERNAL_ID: string | null;
  @ApiProperty({
    description: "Was de vlucht een passagiersvlucht",
    type: "boolean",
  })
  PAX: boolean;
  @ApiProperty({
    description:
      "Was de vlucht een check-start (eerste vlucht van het seizoen voor de vlieger)",
    type: "boolean",
  })
  CHECKSTART: boolean;
  @ApiProperty({
    description: "Was de vlucht een instructievlucht",
    type: "boolean",
  })
  INSTRUCTIEVLUCHT: boolean;
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
