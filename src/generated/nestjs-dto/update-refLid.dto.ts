import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class UpdateRefLidDto {
  @ApiProperty({
    description:
      "De primary ID van het lid, andere objecten refereren naar dit ID",
    type: "integer",
    format: "int32",
    default: "autoincrement",
    required: false,
  })
  @IsOptional()
  @IsInt()
  ID?: number;
  @ApiProperty({
    description: "De voornaam van het lid",
    maxLength: 15,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  VOORNAAM?: string | null;
  @ApiProperty({
    description: "Het tussenvoegsel van de naam",
    maxLength: 8,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  TUSSENVOEGSEL?: string | null;
  @ApiProperty({
    description: "De achternaam van het lid",
    maxLength: 30,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  ACHTERNAAM?: string | null;
  @ApiProperty({
    description: "Het adres waar het lid woont",
    maxLength: 50,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  ADRES?: string | null;
  @ApiProperty({
    description: "De postcode van het adres",
    maxLength: 10,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  POSTCODE?: string | null;
  @ApiProperty({
    description: "De woonplaats van het lid",
    maxLength: 50,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  WOONPLAATS?: string | null;
  @ApiProperty({
    description: "Het vaste huistelefoonnummer van het lid",
    maxLength: 15,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  TELEFOON?: string | null;
  @ApiProperty({
    description: "Het mobiele telefoonnummer van het lid",
    maxLength: 15,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  MOBIEL?: string | null;
  @ApiProperty({
    description: "Het noodnummer voor calamiteiten",
    maxLength: 15,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  NOODNUMMER?: string | null;
  @ApiProperty({
    description: "Het email adres van het lid",
    maxLength: 45,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  EMAIL?: string | null;
  @ApiProperty({
    description:
      "Het lidnummer zoals dat in de financiele administratie wordt gebruikt",
    maxLength: 10,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  LIDNR?: string | null;
  @ApiProperty({
    description: "Verwijzing naar de lidtype (bv. lid, donateur, etc.)",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  LIDTYPE_ID?: number | null;
  @ApiProperty({
    description: "Vliegstatus van het lid (bv. DBO, Solist, Brevethouder etc.)",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  STATUSTYPE_ID?: number | null;
  @ApiProperty({
    description: "Is het lid ook lid van een zusterclub",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  ZUSTERCLUB_ID?: number | null;
  @ApiProperty({
    description: "Verwijzing naar het ID de buddy in de leden tabel",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  BUDDY_ID?: number | null;
  @ApiProperty({
    description: "Verwijzing naar het ID de tweede buddy in de leden tabel",
    type: "integer",
    format: "int32",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  BUDDY_ID2?: number | null;
  @ApiProperty({
    description: "Kan het lid worden ingedeeld voor lierdienst",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  LIERIST?: boolean;
  @ApiProperty({
    description: "Kan het lid worden ingedeeld voor lierist in opleiding",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  LIERIST_IO?: boolean;
  @ApiProperty({
    description: "Kan het lid worden ingedeeld voor startleiderdienst",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  STARTLEIDER?: boolean;
  @ApiProperty({
    description: "Is het lid een instructeur",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  INSTRUCTEUR?: boolean;
  @ApiProperty({
    description: "Zit het lid in de chef instructeurs groep",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  CIMT?: boolean;
  @ApiProperty({
    description: "Helpt het lid met doordeweeks vliegen als kader",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  DDWV_CREW?: boolean;
  @ApiProperty({
    description: "Is het lid beheerder van de DDWV operatie",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  DDWV_BEHEERDER?: boolean;
  @ApiProperty({
    description: "Is het lid applicatie beheerder",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  BEHEERDER?: boolean;
  @ApiProperty({
    description: "Account wordt alleen gebruikt voor tijdschrijven",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  STARTTOREN?: boolean;
  @ApiProperty({
    description: "Is het lid een roostermaaker",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  ROOSTER?: boolean;
  @ApiProperty({
    description: "Is het lid een sleepvlieger",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  SLEEPVLIEGER?: boolean;
  @ApiProperty({
    description:
      "Is het lid een rapporteur om overzicht te maken van de vliegdagen",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  RAPPORTEUR?: boolean;
  @ApiProperty({
    description: "Vliegt het lid gasten rond",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  GASTENVLIEGER?: boolean;
  @ApiProperty({
    description: "Is het lid een technicus",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  TECHNICUS?: boolean;
  @ApiProperty({
    description: "Clubblad wordt per post verstuurd",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  CLUBBLAD_POST?: boolean;
  @ApiProperty({
    description: "Zelfstarts afbetaald voor lopende seizoen",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  ZELFSTART_ABONNEMENT?: boolean;
  @ApiProperty({
    description: "Geldigheid medische keuring",
    type: "string",
    format: "date-time",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  MEDICAL?: Date | null;
  @ApiProperty({
    description: "Geboortedatum van het lid",
    type: "string",
    format: "date-time",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  GEBOORTE_DATUM?: Date | null;
  @ApiProperty({
    description: "Inlognaam voor de website",
    maxLength: 45,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  INLOGNAAM?: string | null;
  @ApiProperty({
    description: "Het wachtwoord",
    minLength: 8,
    maxLength: 50,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  WACHTWOORD?: string | null;
  @ApiProperty({
    description: "Secret key voor twee traps authenticatie",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  SECRET?: string | null;
  @ApiProperty({
    description: "Is twee traps authenticatie ingeschakeld",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  AUTH?: boolean;
  @ApiProperty({
    description: "URL naar de avatar van het lid",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  AVATAR?: string | null;
  @ApiProperty({
    description: "Lid mag niet meer starten, maar is nog wel lid",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  STARTVERBOD?: boolean;
  @ApiProperty({
    description:
      "Lid heeft lidmaatschap voor volgend jaar opgezegd, maar is nog wel lid",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  OPGEZEGD?: boolean;
  @ApiProperty({
    description: "Privacy instelling",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  PRIVACY?: boolean;
  @ApiProperty({
    description: "Sleutelnummer van Terlet",
    maxLength: 25,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  SLEUTEL1?: string | null;
  @ApiProperty({
    description: "Sleutelnummer van Gelderse",
    maxLength: 25,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  SLEUTEL2?: string | null;
  @ApiProperty({
    description: "Sleutelnummer om te kunnen tanken",
    maxLength: 25,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  BRANDSTOF_PAS?: string | null;
  @ApiProperty({
    description:
      "Wat doet het lid in het dagelijkse leven. Handig als we hulp nodig hebben",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  BEROEP?: string | null;
  @ApiProperty({
    description: "Lidmaatschapnummer van de KNVvL",
    maxLength: 25,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  KNVVL_LIDNUMMER?: string | null;
  @ApiProperty({
    description: "Brevetnummer",
    maxLength: 25,
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  BREVET_NUMMER?: string | null;
  @ApiProperty({
    description: "Daginfo per email ontvangen",
    type: "boolean",
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  EMAIL_DAGINFO?: boolean;
  @ApiProperty({
    description: "Opmerkingen van het lid",
    type: "string",
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  OPMERKINGEN?: string | null;
  @ApiProperty({
    description: "Aantal strippen tegoed",
    type: "number",
    format: "float",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  TEGOED?: number;
}
