import { ApiProperty } from "@nestjs/swagger";

export class AuditDto {
  @ApiProperty({
    description:
      "De primary ID van de groep, andere objecten refereren naar dit ID",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description: "De datum van de audit",
    type: "string",
    format: "date-time",
  })
  DATUM: Date;
  @ApiProperty({
    description: "De database tabel waar de wijziging is gedaan",
    type: "string",
    nullable: true,
  })
  TABEL: string | null;
  @ApiProperty({
    description: "De naam van de tabel waar de wijziging is gedaan",
    type: "string",
    nullable: true,
  })
  TABEL_NAAM: string | null;
  @ApiProperty({
    description: "De actie die is uitgevoerd",
    type: "string",
    nullable: true,
  })
  ACTIE: string | null;
  @ApiProperty({
    description: "Het object ID waar de wijziging is gedaan",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  OBJECT_ID: number | null;
  @ApiProperty({
    description: "De data voordat de wijziging is gedaan",
    type: "string",
    nullable: true,
  })
  VOOR: string | null;
  @ApiProperty({
    description: "De data die ten grondslag ligt aan de wijziging",
    type: "string",
    nullable: true,
  })
  DATA: string | null;
  @ApiProperty({
    description: "Het resultaat van de wijziging",
    type: "string",
    nullable: true,
  })
  RESULTAAT: string | null;
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
