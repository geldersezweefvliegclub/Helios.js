import { Prisma } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

export class OperFactuurDto {
  @ApiProperty({
    description: "Het unieke ID van een factuur",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description: "Jaar van het lidmaatschap",
    minimum: 2025,
    type: "integer",
    format: "int32",
  })
  JAAR: number;
  @ApiProperty({
    description:
      "Verwijzing naar het lid ID die de factuur ontvangt, link naar de leden tabel",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  LID_ID: number | null;
  @ApiProperty({
    description:
      "De naam van het lid op het moment dat de factuur aangemaakt is.",
    type: "string",
    nullable: true,
  })
  NAAM: string | null;
  @ApiProperty({
    description:
      "Het lidnummer zoals dat in de financiele administratie wordt gebruikt",
    maxLength: 10,
    type: "string",
    nullable: true,
  })
  LIDNR: string | null;
  @ApiProperty({
    description: "Het factuurnummer zoals dat door de boekhouding is toegekend",
    maxLength: 10,
    type: "string",
    nullable: true,
  })
  FACTUUR_NUMMER: string | null;
  @ApiProperty({
    description: "Lidmaatschapscode",
    maxLength: 10,
    type: "string",
    nullable: true,
  })
  CODE: string | null;
  @ApiProperty({
    description: "Omschrijving van de factuurregel",
    type: "string",
    nullable: true,
  })
  OMSCHRIJVING: string | null;
  @ApiProperty({
    description: "Bedrag wat gefactureerd is",
    type: "string",
    format: "Decimal.js",
    nullable: true,
  })
  GEFACTUREERD: Prisma.Decimal | null;
  @ApiProperty({
    description: "Is het record gemarkeerd als verwijderd",
    type: "integer",
    format: "int32",
  })
  VERWIJDERD: number;
  @ApiProperty({
    description: "Tijdstempel met de laatste wijziging van het record",
    type: "string",
    format: "date-time",
  })
  LAATSTE_AANPASSING: Date;
}
