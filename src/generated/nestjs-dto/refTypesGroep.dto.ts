import { ApiProperty } from "@nestjs/swagger";

export class RefTypesGroepDto {
  @ApiProperty({
    description:
      "De primary ID van de groep, andere objecten refereren naar dit ID",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description: "De code van de groep",
    maxLength: 10,
    type: "string",
    nullable: true,
  })
  CODE: string | null;
  @ApiProperty({
    description: "De externe referentie van de groep",
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
    description: "De sorteer volgorde van de groep",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  SORTEER_VOLGORDE: number | null;
  @ApiProperty({
    description:
      "Is de groep readonly. Indien readonly kan de groep niet worden aangepast vanwege harde verwijzing in de source code",
    type: "boolean",
  })
  READ_ONLY: boolean;
  @ApiProperty({
    description:
      "De onderliggende type tabel bevat EENHEDEN en BEDRAG. Deze boolean geeft aan of dat gebruikt wordt",
    type: "boolean",
  })
  BEDRAG_EENHEDEN: boolean;
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
