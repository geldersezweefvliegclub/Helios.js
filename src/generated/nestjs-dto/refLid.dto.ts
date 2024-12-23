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
    description: "Het vaset huistelefoonnummer van het lid",
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
    nullable: true,
  })
  LIDTYPE_ID: number | null;
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
    type: "boolean",
  })
  LIERIST: boolean;
  @ApiProperty({
    description: "Kan het lid worden ingedeeld voor lierist in opleiding",
    type: "boolean",
  })
  LIERIST_IO: boolean;
  @ApiProperty({
    description: "Kan het lid worden ingedeeld voor startleiderdienst",
    type: "boolean",
  })
  STARTLEIDER: boolean;
  @ApiProperty({
    description: "Is het lid een instructeur",
    type: "boolean",
  })
  INSTRUCTEUR: boolean;
  @ApiProperty({
    description: "Zit het lid in de chef instructeurs groep",
    type: "boolean",
  })
  CIMT: boolean;
  @ApiProperty({
    description: "Helpt het lid met doordeweeks vliegen als kader",
    type: "boolean",
  })
  DDWV_CREW: boolean;
  @ApiProperty({
    description: "Is het lid beheerder van de DDWV operatie",
    type: "boolean",
  })
  DDWV_BEHEERDER: boolean;
  @ApiProperty({
    description: "Is het lid applicatie beheerder",
    type: "boolean",
  })
  BEHEERDER: boolean;
  @ApiProperty({
    description: "Account wordt alleen gebruikt voor tijdschrijven",
    type: "boolean",
  })
  STARTTOREN: boolean;
  @ApiProperty({
    description: "Is het lid een roostermaaker",
    type: "boolean",
  })
  ROOSTER: boolean;
  @ApiProperty({
    description: "Is het lid een sleepvlieger",
    type: "boolean",
  })
  SLEEPVLIEGER: boolean;
  @ApiProperty({
    description:
      "Is het lid een rapporteur om overzicht te maken van de vliegdagen",
    type: "boolean",
  })
  RAPPORTEUR: boolean;
  @ApiProperty({
    description: "Vliegt het lid gasten rond",
    type: "boolean",
  })
  GASTENVLIEGER: boolean;
  @ApiProperty({
    description: "Is het lid een technicus",
    type: "boolean",
  })
  TECHNICUS: boolean;
  @ApiProperty({
    description: "Clubblad wordt per post verstuurd",
    type: "boolean",
  })
  CLUBBLAD_POST: boolean;
  @ApiProperty({
    description: "Zelfstarts afbetaald voor lopende seizoen",
    type: "boolean",
  })
  ZELFSTART_ABONNEMENT: boolean;
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
    type: "boolean",
  })
  AUTH: boolean;
  @ApiProperty({
    description: "Is het lid een actief lid",
    type: "string",
    nullable: true,
  })
  AVATAR: string | null;
  @ApiProperty({
    description: "Lid mag niet meer starten, maar is nog wel lid",
    type: "boolean",
  })
  STARTVERBOD: boolean;
  @ApiProperty({
    description:
      "Lid heeft lidmaatschap voor volgend jaar opgezegd, maar is nog wel lid",
    type: "boolean",
  })
  OPGEZEGD: boolean;
  @ApiProperty({
    description: "Privacy instelling",
    type: "boolean",
  })
  PRIVACY: boolean;
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
    description: "Sleutelnummer om te kunnen tanken",
    maxLength: 25,
    type: "string",
    nullable: true,
  })
  BRANDSTOF_PAS: string | null;
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
    type: "boolean",
  })
  EMAIL_DAGINFO: boolean;
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
