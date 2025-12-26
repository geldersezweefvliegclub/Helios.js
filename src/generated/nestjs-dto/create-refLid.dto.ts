import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateRefLidDto {
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
  })
  @IsOptional()
  @IsInt()
  LIDTYPE_ID?: number;
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
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  LIERIST?: number;
  @ApiProperty({
    description: "Kan het lid worden ingedeeld voor lierist in opleiding",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  LIERIST_IO?: number;
  @ApiProperty({
    description: "Kan het lid worden ingedeeld voor startleiderdienst",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  STARTLEIDER?: number;
  @ApiProperty({
    description: "Is het lid een instructeur",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  INSTRUCTEUR?: number;
  @ApiProperty({
    description: "Zit het lid in de chef instructeurs groep",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  CIMT?: number;
  @ApiProperty({
    description: "Helpt het lid met doordeweeks vliegen als kader",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  DDWV_CREW?: number;
  @ApiProperty({
    description: "Is het lid beheerder van de DDWV operatie",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  DDWV_BEHEERDER?: number;
  @ApiProperty({
    description: "Is het lid applicatie beheerder",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  BEHEERDER?: number;
  @ApiProperty({
    description: "Account wordt alleen gebruikt voor tijdschrijven",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  STARTTOREN?: number;
  @ApiProperty({
    description: "Is het lid een roostermaaker",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  ROOSTER?: number;
  @ApiProperty({
    description: "Is het lid een sleepvlieger",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  SLEEPVLIEGER?: number;
  @ApiProperty({
    description:
      "Is het lid een rapporteur om overzicht te maken van de vliegdagen",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  RAPPORTEUR?: number;
  @ApiProperty({
    description: "Vliegt het lid gasten rond",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  GASTENVLIEGER?: number;
  @ApiProperty({
    description: "Is het lid een technicus",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  TECHNICUS?: number;
  @ApiProperty({
    description: "Clubblad wordt per post verstuurd",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  CLUBBLAD_POST?: number;
  @ApiProperty({
    description: "Zelfstarts afbetaald voor lopende seizoen",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  ZELFSTART_ABONNEMENT?: number;
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
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  AUTH?: number;
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
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  STARTVERBOD?: number;
  @ApiProperty({
    description:
      "Lid heeft lidmaatschap voor volgend jaar opgezegd, maar is nog wel lid",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  OPGEZEGD?: number;
  @ApiProperty({
    description: "Privacy instelling",
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  PRIVACY?: number;
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
    type: "integer",
    format: "int32",
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  EMAIL_DAGINFO?: number;
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
}
