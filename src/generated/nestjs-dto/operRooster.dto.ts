import { ApiProperty } from "@nestjs/swagger";

export class OperRoosterDto {
  @ApiProperty({
    description: "Het unieke ID van de dienst",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description: "Datum van de aanmelding",
    type: "string",
    format: "date-time",
  })
  DATUM: Date;
  @ApiProperty({
    description: "Is het een DDWV bedrijf op het primaire veld",
    type: "boolean",
  })
  DDWV: boolean;
  @ApiProperty({
    description: "Is het een Club bedrijf op het primaire veld",
    type: "boolean",
  })
  CLUB_BEDRIJF: boolean;
  @ApiProperty({
    description: "Voeren we winterwerk uit op deze datum?",
    type: "boolean",
  })
  WINTER_WERK: boolean;
  @ApiProperty({
    description: "Aantal aameldingen die we nodig hebben voor een sleepbedrijf",
    minimum: 0,
    maximum: 25,
    type: "integer",
    format: "int32",
    nullable: true,
  })
  MIN_SLEEPSTART: number | null;
  @ApiProperty({
    description: "Aantal aameldingen die we nodig hebben voor een lierbedrijf",
    minimum: 0,
    maximum: 25,
    type: "integer",
    format: "int32",
    nullable: true,
  })
  MIN_LIERSTART: number | null;
  @ApiProperty({
    description: "Eventuele opmerkingen, zoals eerder weg gaan",
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
