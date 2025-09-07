import { ApiProperty } from "@nestjs/swagger";

export class OperProgressieDto {
  @ApiProperty({
    description: "Het unieke ID van een factuur",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description:
      "Verwijzing naar het lid die de competentie gehaald heeft, link naar de leden tabel",
    type: "integer",
    format: "int32",
  })
  LID_ID: number;
  @ApiProperty({
    description:
      "Verwijzing naar de instructeur die de progressie heeft afgetekend, link naar de leden tabel",
    type: "integer",
    format: "int32",
  })
  INSTRUCTEUR_ID: number;
  @ApiProperty({
    description: "Verwijzing naar de competentie die het lid gehaald heeft",
    type: "integer",
    format: "int32",
  })
  COMPETENTIE_ID: number;
  @ApiProperty({
    description: "Tijdstempel wanneer de progressie is afgetekend",
    type: "string",
    format: "date-time",
  })
  INGEVOERD: Date;
  @ApiProperty({
    description:
      "Tot wanneer is de progressie geldig (Bijv theorie certificaat)",
    type: "string",
    format: "date-time",
    nullable: true,
  })
  GELDIG_TOT: Date | null;
  @ApiProperty({
    description: "Hoe ver is de progessie gevorderd? (1=basis,5 =volledig)",
    minimum: 1,
    maximum: 5,
    type: "integer",
    format: "int32",
    nullable: true,
  })
  SCORE: number | null;
  @ApiProperty({
    description: "Omschrijving van de factuurregel",
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
