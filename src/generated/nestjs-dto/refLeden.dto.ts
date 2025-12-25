import { ApiProperty } from "@nestjs/swagger";

export class RefLedenDto {
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    type: "string",
  })
  NAAM: string;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  VOORNAAM: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  TUSSENVOEGSEL: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  ACHTERNAAM: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  ADRES: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  POSTCODE: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  WOONPLAATS: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  TELEFOON: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  MOBIEL: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  NOODNUMMER: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  EMAIL: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  LIDNR: string | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
    nullable: true,
  })
  STATUSTYPE_ID: number | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
    nullable: true,
  })
  BUDDY_ID2: number | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  LIERIST: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  LIERIST_IO: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  STARTLEIDER: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  INSTRUCTEUR: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  CIMT: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  DDWV_CREW: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  DDWV_BEHEERDER: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  BEHEERDER: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  STARTTOREN: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  ROOSTER: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  SLEEPVLIEGER: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  RAPPORTEUR: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  GASTENVLIEGER: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  TECHNICUS: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  CLUBBLAD_POST: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  ZELFSTART_ABONNEMENT: number;
  @ApiProperty({
    type: "string",
    format: "date-time",
    nullable: true,
  })
  MEDICAL: Date | null;
  @ApiProperty({
    type: "string",
    format: "date-time",
    nullable: true,
  })
  GEBOORTE_DATUM: Date | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  INLOGNAAM: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  WACHTWOORD: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  SECRET: string | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  AUTH: number;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  AVATAR: string | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  STARTVERBOD: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  OPGEZEGD: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  PRIVACY: number;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  SLEUTEL1: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  SLEUTEL2: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  BEROEP: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  KNVVL_LIDNUMMER: string | null;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  BREVET_NUMMER: string | null;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  EMAIL_DAGINFO: number;
  @ApiProperty({
    type: "string",
    nullable: true,
  })
  OPMERKINGEN: string | null;
  @ApiProperty({
    type: "number",
    format: "float",
  })
  TEGOED: number;
  @ApiProperty({
    type: "integer",
    format: "int32",
  })
  VERWIJDERD: number;
  @ApiProperty({
    type: "string",
    format: "date-time",
  })
  LAATSTE_AANPASSING: Date;
}
