import { ApiProperty } from "@nestjs/swagger";

export class OperTransactieDto {
  @ApiProperty({
    description: "Het unieke ID van de transactie",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description: "Datum van het dagrapport",
    type: "string",
    format: "date-time",
  })
  DATUM: Date;
  @ApiProperty({
    description:
      "Transactie heeft betrekking op een DDWV vliegdag, dit is de datum van de vliegdag",
    type: "string",
    format: "date-time",
    nullable: true,
  })
  VLIEGDAG: Date | null;
  @ApiProperty({
    description:
      "Verwijzing naar het lid ID van de vlieger, link naar de leden tabel",
    type: "integer",
    format: "int32",
  })
  LID_ID: number;
  @ApiProperty({
    description:
      "Verwijzing naar het lid ID van de persoon die de transactie heeft aangemaakt, link naar de leden tabel",
    type: "integer",
    format: "int32",
  })
  INGEVOERD_ID: number;
  @ApiProperty({
    description:
      "Referentie naar het type van de transactie, link naar type tabel",
    type: "integer",
    format: "int32",
  })
  TYPE_ID: number;
  @ApiProperty({
    description: "Gaat het hier om een DDWV transactie?",
    type: "boolean",
  })
  DDWV: boolean;
  @ApiProperty({
    description: "Het bedrag wat gefactureerd wordt per eenheid",
    type: "number",
    format: "float",
    nullable: true,
  })
  BEDRAG: number | null;
  @ApiProperty({
    description:
      "De eenheden om te kunnen boeken, bijvoorbeeld aantal lierstarts, of aantal strippen",
    type: "number",
    format: "float",
    nullable: true,
  })
  EENHEDEN: number | null;
  @ApiProperty({
    description: "Aantal strippen voordat de transcatie verwerkt is.",
    type: "number",
    format: "float",
    nullable: true,
  })
  SALDO_VOOR: number | null;
  @ApiProperty({
    description: "Aantal strippen NA de transactie, dus het nieuwe saldo",
    type: "number",
    format: "float",
    nullable: true,
  })
  SALDO_NA: number | null;
  @ApiProperty({
    description:
      "Referentie naar een extern system, bijv Mollie of e-boekhouden",
    type: "string",
    nullable: true,
  })
  EXT_REF: string | null;
  @ApiProperty({
    description: "Omschrijving van de transactie, komt zo ook op de factuur",
    type: "string",
    nullable: true,
  })
  OMSCHRIJVING: string | null;
  @ApiProperty({
    description: "Is de transactie betaald bijv Mollie",
    type: "boolean",
  })
  BETAALD: boolean;
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
