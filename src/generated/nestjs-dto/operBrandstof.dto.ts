import { Prisma } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

export class OperBrandstofDto {
  @ApiProperty({
    description:
      "De primary ID van het tankbeurt, andere objecten refereren naar dit ID",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description:
      "Verwijzing naar het lid ID van de persoon die getankt heeft, link naar de leden tabel",
    type: "integer",
    format: "int32",
  })
  LID_ID: number;
  @ApiProperty({
    description: "De naam van het lid die de tankbeurt heeft gedaan",
    type: "string",
  })
  NAAM: string;
  @ApiProperty({
    description: "Het tijdstip van de tankbeurt",
    type: "string",
    format: "date-time",
  })
  TIJDSTIP: Date;
  @ApiProperty({
    description: "Vliegstatus van het lid (bv. DBO, Solist, Brevethouder etc.)",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  BRANDSTOF_TYPE_ID: number | null;
  @ApiProperty({
    description: "Prijs per liter van de brandstof",
    type: "number",
    format: "double",
    nullable: true,
  })
  PRIJS: Prisma.Decimal | null;
  @ApiProperty({
    description: "Het bedrag van de tankbeurt om te kunnen factureren",
    type: "number",
    format: "double",
    nullable: true,
  })
  BEDRAG: Prisma.Decimal | null;
  @ApiProperty({
    description: "Aantal liters dat getankt is",
    type: "number",
    format: "double",
    nullable: true,
  })
  LITERS: Prisma.Decimal | null;
  @ApiProperty({
    description: "Externe referentie van de tankbeurt",
    maxLength: 50,
    type: "string",
    nullable: true,
  })
  EXT_REF: string | null;
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
