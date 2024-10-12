import { ApiProperty } from "@nestjs/swagger";

export class CreateRefTypesGroepenDto {
  @ApiProperty({
    description: "De code van de groep",
    type: "string",
    required: false,
    nullable: true,
  })
  CODE?: string | null;
  @ApiProperty({
    description: "De externe referentie van de groep",
    type: "string",
    required: false,
    nullable: true,
  })
  EXT_REF?: string | null;
  @ApiProperty({
    description: "De omschrijving van de groep",
    type: "string",
  })
  OMSCHRIJVING: string;
  @ApiProperty({
    description: "De sorteer volgorde van de groep",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  SORTEER_VOLGORDE?: number | null;
  @ApiProperty({
    description: "Het bedrag van de groep",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  BEDRAG_EENHEDEN?: number | null;
}
