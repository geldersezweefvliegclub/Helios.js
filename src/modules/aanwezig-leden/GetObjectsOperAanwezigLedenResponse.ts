
import {ApiTags, ApiProperty} from "@nestjs/swagger";
import {OperAanwezigLidDto} from "../../generated/nestjs-dto/operAanwezigLid.dto";

// deze velden komen uit de aanwezig_leden_view in de PHP implementatie (join met ref_leden, ref_types, ref_vliegtuigen
// en berekende velden op basis van oper_startlijst), zie class.AanwezigLeden.inc.php CreateViews()
@ApiTags('AanwezigLeden')
export class GetObjectsOperAanwezigLedenResponse extends OperAanwezigLidDto
{
   @ApiProperty({type: String, required: false, description: 'Registratie en callsign van het overland vliegtuig'})
   REG_CALL?: string | null;

   @ApiProperty({type: String, required: false, description: 'Naam van het lid'})
   NAAM?: string;

   @ApiProperty({type: String, required: false, description: 'Voornaam van het lid'})
   VOORNAAM?: string | null;

   @ApiProperty({type: String, required: false, description: 'Tussenvoegsel van het lid'})
   TUSSENVOEGSEL?: string | null;

   @ApiProperty({type: String, required: false, description: 'Achternaam van het lid'})
   ACHTERNAAM?: string | null;

   @ApiProperty({type: String, required: false, description: 'Adres van het lid'})
   ADRES?: string | null;

   @ApiProperty({type: String, required: false, description: 'Postcode van het lid'})
   POSTCODE?: string | null;

   @ApiProperty({type: String, required: false, description: 'Woonplaats van het lid'})
   WOONPLAATS?: string | null;

   @ApiProperty({type: String, required: false, description: 'Lidnummer van het lid'})
   LIDNR?: string | null;

   @ApiProperty({type: Number, required: false, description: 'Lidtype ID van het lid'})
   LIDTYPE_ID?: number;

   @ApiProperty({type: String, required: false, description: 'Mobiel nummer van het lid'})
   MOBIEL?: string | null;

   @ApiProperty({type: String, required: false, description: 'Email van het lid'})
   EMAIL?: string | null;

   @ApiProperty({type: String, required: false, description: 'Noodnummer van het lid'})
   NOODNUMMER?: string | null;

   @ApiProperty({type: String, required: false, description: 'Telefoonnummer van het lid'})
   TELEFOON?: string | null;

   @ApiProperty({type: Boolean, required: false, description: 'Is het lid instructeur'})
   INSTRUCTEUR?: boolean;

   @ApiProperty({type: Boolean, required: false, description: 'Is het lid startleider'})
   STARTLEIDER?: boolean;

   @ApiProperty({type: Boolean, required: false, description: 'Is het lid lierist'})
   LIERIST?: boolean;

   @ApiProperty({type: Boolean, required: false, description: 'Is het lid CIMT'})
   CIMT?: boolean;

   @ApiProperty({type: Boolean, required: false, description: 'Is het lid DDWV crew'})
   DDWV_CREW?: boolean;

   @ApiProperty({type: Boolean, required: false, description: 'Is het lid DDWV beheerder'})
   DDWV_BEHEERDER?: boolean;

   @ApiProperty({type: Boolean, required: false, description: 'Is het lid beheerder'})
   BEHEERDER?: boolean;

   @ApiProperty({type: Boolean, required: false, description: 'Is het lid starttoren'})
   STARTTOREN?: boolean;

   @ApiProperty({type: Boolean, required: false, description: 'Is het lid rooster'})
   ROOSTER?: boolean;

   @ApiProperty({type: Boolean, required: false, description: 'Wil het lid het clubblad per post'})
   CLUBBLAD_POST?: boolean;

   @ApiProperty({type: Date, required: false, description: 'Geldigheidsdatum van de medical van het lid'})
   MEDICAL?: Date | null;

   @ApiProperty({type: Date, required: false, description: 'Geboortedatum van het lid'})
   GEBOORTE_DATUM?: Date | null;

   @ApiProperty({type: Number, required: false, description: 'Zusterclub ID van het lid'})
   ZUSTERCLUB_ID?: number | null;

   @ApiProperty({type: String, required: false, description: 'Inlognaam van het lid'})
   INLOGNAAM?: string | null;

   @ApiProperty({type: String, required: false, description: 'Secret (2FA) van het lid'})
   SECRET?: string | null;

   @ApiProperty({type: String, required: false, description: 'Avatar van het lid'})
   AVATAR?: string | null;

   @ApiProperty({type: Boolean, required: false, description: 'Heeft het lid een startverbod'})
   STARTVERBOD?: boolean;

   @ApiProperty({type: Boolean, required: false, description: 'Wil het lid geen privacy gevoelige gegevens tonen'})
   PRIVACY?: boolean;

   @ApiProperty({type: Number, required: false, description: 'Vliegstatus type ID van het lid'})
   STATUSTYPE_ID?: number | null;

   @ApiProperty({type: String, required: false, description: 'Omschrijving van het vliegveld (VELD_ID)'})
   VELD?: string | null;

   @ApiProperty({type: Boolean, required: false, description: 'Heeft het lid een zelfstart abonnement'})
   ZELFSTART_ABONNEMENT?: boolean;

   @ApiProperty({type: String, required: false, description: 'Omschrijving van het lidtype'})
   LIDTYPE?: string;

   @ApiProperty({type: String, required: false, description: 'Code van de vliegstatus van het lid'})
   STATUS?: string | null;

   @ApiProperty({type: Number, required: false, description: 'Sorteervolgorde van de vliegstatus van het lid'})
   STATUS_SORTEER_VOLGORDE?: number | null;

   @ApiProperty({type: String, required: false, description: 'Codes van de gewenste vliegtuigtypes (VOORKEUR_VLIEGTUIG_TYPE)'})
   VLIEGTUIGTYPE_CODE?: string | null;

   @ApiProperty({type: String, required: false, description: 'Omschrijvingen van de gewenste vliegtuigtypes (VOORKEUR_VLIEGTUIG_TYPE)'})
   VLIEGTUIGTYPE_OMS?: string | null;

   @ApiProperty({type: String, required: false, description: 'Totale vliegtijd van het lid als vlieger vandaag (HH:mm)'})
   VLIEGTIJD?: string | null;

   @ApiProperty({type: Number, required: false, description: 'Aantal starts van het lid als vlieger vandaag'})
   STARTS?: number;

   @ApiProperty({type: Number, required: false, description: 'Is het lid momenteel aan het vliegen (1) of niet (0)'})
   VLIEGT?: number;

   @ApiProperty({type: String, required: false, description: 'Vliegcurrency-indicator van het lid over de laatste 26 weken (rood/geel/groen), enkel zichtbaar voor Beheerder/Instructeur/CIMT'})
   STATUS_BAROMETER?: string;
}
