import { Prisma } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

export class RefTypeDto {
  @ApiProperty({
    description:
      "De primary ID van het type, andere objecten refereren naar dit ID",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description: "Verwijzing naar de RefTypesGroepen",
    type: "integer",
    format: "int32",
  })
  TYPEGROEP_ID: number;
  @ApiProperty({
    description: "De code van dit type",
    maxLength: 10,
    type: "string",
    nullable: true,
  })
  CODE: string | null;
  @ApiProperty({
    description: "De externe referentie van dit type",
    maxLength: 25,
    type: "string",
    nullable: true,
  })
  EXT_REF: string | null;
  @ApiProperty({
    description: "De omschrijving van de groep",
    maxLength: 75,
    type: "string",
  })
  OMSCHRIJVING: string;
  @ApiProperty({
    type: "integer",
    format: "int32",
    nullable: true,
  })
  SORTEER_VOLGORDE: number | null;
  @ApiProperty({
    description:
      "Is dit type readonly. Indien readonly kan de groep niet worden aangepast vanwege harde verwijzing in de source code",
    type: "boolean",
  })
  READ_ONLY: boolean;
  @ApiProperty({
    description: "Het bedrag om te kunnen factureren",
    type: "number",
    format: "double",
    nullable: true,
  })
  BEDRAG: Prisma.Decimal | null;
  @ApiProperty({
    description: "De eenheden om te kunnen boeken, bijvoorbeeld DDWV strippen",
    type: "number",
    format: "double",
    nullable: true,
  })
  EENHEDEN: Prisma.Decimal | null;
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
