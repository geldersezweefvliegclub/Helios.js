import { ApiProperty } from "@nestjs/swagger";

export class OperReserveringDto {
  @ApiProperty({
    description: "Het unieke ID van een reservering",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description:
      "Datum waarvoor een persoon een vliegtuig heeft gereserveerd (niet de datum van invoer)",
    type: "string",
    format: "date-time",
  })
  DATUM: Date;
  @ApiProperty({
    description: "Verwijzing naar het vliegtuig dat gereserveerd is",
    type: "integer",
    format: "int32",
  })
  VLIEGTUIG_ID: number;
  @ApiProperty({
    description: "Verwijzing naar het lid die de reservering heeft gemaakt",
    type: "integer",
    format: "int32",
  })
  LID_ID: number;
  @ApiProperty({
    description: "Tijdstip wanneer de reservering is ingevoerd",
    type: "integer",
    format: "int32",
  })
  INGEVOERD_ID: number;
  @ApiProperty({
    description:
      "Is kist geboekt voor een langere periode. Toekenning door beheerder",
    type: "boolean",
  })
  IS_GEBOEKT: boolean;
  @ApiProperty({
    description: "Eventuele opmerkingen bij de reservering",
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
