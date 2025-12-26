import { ApiProperty } from "@nestjs/swagger";

export class RefLidDto {
  @ApiProperty({
    description:
      "De primary ID van het lid, andere objecten refereren naar dit ID",
    type: "integer",
    format: "int32",
  })
  ID: number;
  @ApiProperty({
    description:
      "De naam van het lid, wordt gegenereerd uit de voornaam, tussenvoegsel en achternaam",
    type: "string",
  })
  NAAM: string;
  @ApiProperty({
    description: "De voornaam van het lid",
    maxLength: 15,
    type: "string",
    nullable: true,
  })
  VOORNAAM: string | null;
  @ApiProperty({
    description: "Het tussenvoegsel van de naam",
    maxLength: 8,
    type: "string",
    nullable: true,
  })
  TUSSENVOEGSEL: string | null;
  @ApiProperty({
    description: "De achternaam van het lid",
    maxLength: 30,
    type: "string",
    nullable: true,
  })
  ACHTERNAAM: string | null;
  @ApiProperty({
    description: "Het adres waar het lid woont",
    maxLength: 50,
    type: "string",
    nullable: true,
  })
  ADRES: string | null;
  @ApiProperty({
    description: "De postcode van het adres",
    maxLength: 10,
    type: "string",
    nullable: true,
  })
  POSTCODE: string | null;
  @ApiProperty({
    description: "De woonplaats van het lid",
    maxLength: 50,
    type: "string",
    nullable: true,
  })
  WOONPLAATS: string | null;
  @ApiProperty({
    description: "Het vaste huistelefoonnummer van het lid",
    maxLength: 15,
    type: "string",
    nullable: true,
  })
  TELEFOON: string | null;
  @ApiProperty({
    description: "Het mobiele telefoonnummer van het lid",
    maxLength: 15,
    type: "string",
    nullable: true,
  })
  MOBIEL: string | null;
  @ApiProperty({
    description: "Het noodnummer voor calamiteiten",
    maxLength: 15,
    type: "string",
    nullable: true,
  })
  NOODNUMMER: string | null;
  @ApiProperty({
    description: "Het email adres van het lid",
    maxLength: 45,
    type: "string",
    nullable: true,
  })
  EMAIL: string | null;
  @ApiProperty({
    description:
      "Het lidnummer zoals dat in de financiele administratie wordt gebruikt",
    maxLength: 10,
    type: "string",
    nullable: true,
  })
  LIDNR: string | null;
  @ApiProperty({
    description: "Verwijzing naar de lidtype (bv. lid, donateur, etc.)",
    type: "integer",
    format: "int32",
  })
  LIDTYPE_ID: number;
  @ApiProperty({
    description: "Vliegstatus van het lid (bv. DBO, Solist, Brevethouder etc.)",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  STATUSTYPE_ID: number | null;
  @ApiProperty({
    description: "Is het lid ook lid van een zusterclub",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  ZUSTERCLUB_ID: number | null;
  @ApiProperty({
    description: "Verwijzing naar het ID de buddy in de leden tabel",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  BUDDY_ID: number | null;
  @ApiProperty({
    description: "Verwijzing naar het ID de tweede buddy in de leden tabel",
    type: "integer",
    format: "int32",
    nullable: true,
  })
  BUDDY_ID2: number | null;
  @ApiProperty({
    description: "Kan het lid worden ingedeeld voor lierdienst",
    type: "integer",
    format: "int32",
  })
  LIERIST: number;
  @ApiProperty({
    description: "Kan het lid worden ingedeeld voor lierist in opleiding",
    type: "integer",
    format: "int32",
  })
  LIERIST_IO: number;
  @ApiProperty({
    description: "Kan het lid worden ingedeeld voor startleiderdienst",
    type: "integer",
    format: "int32",
  })
  STARTLEIDER: number;
  @ApiProperty({
    description: "Is het lid een instructeur",
    type: "integer",
    format: "int32",
  })
  INSTRUCTEUR: number;
  @ApiProperty({
    description: "Zit het lid in de chef instructeurs groep",
    type: "integer",
    format: "int32",
  })
  CIMT: number;
  @ApiProperty({
    description: "Helpt het lid met doordeweeks vliegen als kader",
    type: "integer",
    format: "int32",
  })
  DDWV_CREW: number;
  @ApiProperty({
    description: "Is het lid beheerder van de DDWV operatie",
    type: "integer",
    format: "int32",
  })
  DDWV_BEHEERDER: number;
  @ApiProperty({
    description: "Is het lid applicatie beheerder",
    type: "integer",
    format: "int32",
  })
  BEHEERDER: number;
  @ApiProperty({
    description: "Account wordt alleen gebruikt voor tijdschrijven",
    type: "integer",
    format: "int32",
  })
  STARTTOREN: number;
  @ApiProperty({
    description: "Is het lid een roostermaaker",
    type: "integer",
    format: "int32",
  })
  ROOSTER: number;
  @ApiProperty({
    description: "Is het lid een sleepvlieger",
    type: "integer",
    format: "int32",
  })
  SLEEPVLIEGER: number;
  @ApiProperty({
    description:
      "Is het lid een rapporteur om overzicht te maken van de vliegdagen",
    type: "integer",
    format: "int32",
  })
  RAPPORTEUR: number;
  @ApiProperty({
    description: "Vliegt het lid gasten rond",
    type: "integer",
    format: "int32",
  })
  GASTENVLIEGER: number;
  @ApiProperty({
    description: "Is het lid een technicus",
    type: "integer",
    format: "int32",
  })
  TECHNICUS: number;
  @ApiProperty({
    description: "Clubblad wordt per post verstuurd",
    type: "integer",
    format: "int32",
  })
  CLUBBLAD_POST: number;
  @ApiProperty({
    description: "Zelfstarts afbetaald voor lopende seizoen",
    type: "integer",
    format: "int32",
  })
  ZELFSTART_ABONNEMENT: number;
  @ApiProperty({
    description: "Geldigheid medische keuring",
    type: "string",
    format: "date-time",
    nullable: true,
  })
  MEDICAL: Date | null;
  @ApiProperty({
    description: "Geboortedatum van het lid",
    type: "string",
    format: "date-time",
    nullable: true,
  })
  GEBOORTE_DATUM: Date | null;
  @ApiProperty({
    description: "Inlognaam voor de website",
    maxLength: 45,
    type: "string",
    nullable: true,
  })
  INLOGNAAM: string | null;
  @ApiProperty({
    description: "Het wachtwoord",
    minLength: 8,
    maxLength: 50,
    type: "string",
    nullable: true,
  })
  WACHTWOORD: string | null;
  @ApiProperty({
    description: "Secret key voor twee traps authenticatie",
    type: "string",
    nullable: true,
  })
  SECRET: string | null;
  @ApiProperty({
    description: "Is twee traps authenticatie ingeschakeld",
    type: "integer",
    format: "int32",
  })
  AUTH: number;
  @ApiProperty({
    description: "URL naar de avatar van het lid",
    type: "string",
    nullable: true,
  })
  AVATAR: string | null;
  @ApiProperty({
    description: "Lid mag niet meer starten, maar is nog wel lid",
    type: "integer",
    format: "int32",
  })
  STARTVERBOD: number;
  @ApiProperty({
    description:
      "Lid heeft lidmaatschap voor volgend jaar opgezegd, maar is nog wel lid",
    type: "integer",
    format: "int32",
  })
  OPGEZEGD: number;
  @ApiProperty({
    description: "Privacy instelling",
    type: "integer",
    format: "int32",
  })
  PRIVACY: number;
  @ApiProperty({
    description: "Sleutelnummer van Terlet",
    maxLength: 25,
    type: "string",
    nullable: true,
  })
  SLEUTEL1: string | null;
  @ApiProperty({
    description: "Sleutelnummer van Gelderse",
    maxLength: 25,
    type: "string",
    nullable: true,
  })
  SLEUTEL2: string | null;
  @ApiProperty({
    description:
      "Wat doet het lid in het dagelijkse leven. Handig als we hulp nodig hebben",
    type: "string",
    nullable: true,
  })
  BEROEP: string | null;
  @ApiProperty({
    description: "Lidmaatschapnummer van de KNVvL",
    maxLength: 25,
    type: "string",
    nullable: true,
  })
  KNVVL_LIDNUMMER: string | null;
  @ApiProperty({
    description: "Brevetnummer",
    maxLength: 25,
    type: "string",
    nullable: true,
  })
  BREVET_NUMMER: string | null;
  @ApiProperty({
    description: "Daginfo per email ontvangen",
    type: "integer",
    format: "int32",
  })
  EMAIL_DAGINFO: number;
  @ApiProperty({
    description: "Opmerkingen van het lid",
    type: "string",
    nullable: true,
  })
  OPMERKINGEN: string | null;
  @ApiProperty({
    description: "Aantal strippen tegoed",
    type: "number",
    format: "float",
  })
  TEGOED: number;
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
  @ApiProperty({
    description: "Sleutelnummer om te kunnen tanken",
    maxLength: 25,
    type: "string",
    nullable: true,
  })
  BRANDSTOF_PAS: string | null;
}
