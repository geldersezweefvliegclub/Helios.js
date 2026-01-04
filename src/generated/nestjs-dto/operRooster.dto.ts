import { ApiProperty } from "@nestjs/swagger";

export class OperRoosterDto {
  @ApiProperty({
    description: "Het unieke ID van het rooster record",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description: "Datum van de vliegdag",
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
    description:
      "Aantal aameldingen die we nodig hebben voor een sleepbedrijf (alleen DDWV)",
    minimum: 0,
    maximum: 25,
    type: "integer",
    format: "int32",
  })
  MIN_SLEEPSTART: number;
  @ApiProperty({
    description:
      "Aantal aameldingen die we nodig hebben voor een lierbedrijf (alleen DDWV)",
    minimum: 0,
    maximum: 25,
    type: "integer",
    format: "int32",
  })
  MIN_LIERSTART: number;
  @ApiProperty({
    description: "Eventuele opmerkingen voor deze dag",
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
    type: "string",
    format: "date-time",
  })
  LAATSTE_AANPASSING: Date;
}
