import { ApiProperty } from "@nestjs/swagger";

export class RefCompetentieDto {
  @ApiProperty({
    description:
      "De primary ID van de competentie, andere objecten refereren naar dit ID",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description: "Sorteer volgorde",
    minimum: 0,
    type: "integer",
    format: "int32",
    nullable: true,
  })
  VOLGORDE: number | null;
  @ApiProperty({
    description: "Het type vliegtuig, relatie naar de types tabel",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  LEERFASE_ID: number | null;
  @ApiProperty({
    description: "Bovenliggende competentie",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  OUDER_ID: number | null;
  @ApiProperty({
    description: "Leerblok van de comptentie zoals in de syllabus",
    maxLength: 7,
    type: "string",
    nullable: true,
  })
  BLOK: string | null;
  @ApiProperty({
    description: "Omschrijving van de competentie",
    minLength: 3,
    maxLength: 75,
    type: "string",
  })
  OMSCHRIJVING: string;
  @ApiProperty({
    description: "Omschrijving van de competentie",
    maxLength: 75,
    type: "string",
    nullable: true,
  })
  DOCUMENTATIE: string | null;
  @ApiProperty({
    description: "Is deze competentie beperkt geldig",
    type: "boolean",
  })
  GELDIGHEID: boolean;
  @ApiProperty({
    description: "Wordt score 1-5 gegeven voor deze competentie",
    type: "boolean",
  })
  SCORE: boolean;
  @ApiProperty({
    description: "Is de competentie gemarkeerd als verwijderd",
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
