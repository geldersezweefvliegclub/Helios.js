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
    type: "boolean",
  })
  DAGNUMMER: boolean;
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
    description: "De hoogte waarop is losgekoppeld tijdens de sleep",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  SLEEP_HOOGTE: number | null;
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
