
import {ApiTags, ApiProperty} from "@nestjs/swagger";
import {OperAanwezigVliegtuigDto} from "../../generated/nestjs-dto/operAanwezigVliegtuig.dto";

// deze velden komen uit de aanwezig_vliegtuigen_view in de PHP implementatie (join met ref_vliegtuigen en ref_types)
@ApiTags('AanwezigVliegtuigen')
export class GetObjectsOperAanwezigVliegtuigenResponse extends OperAanwezigVliegtuigDto
{
   @ApiProperty({type: String, required: false, description: 'Registratie van het vliegtuig'})
   REGISTRATIE?: string;

   @ApiProperty({type: String, required: false, description: 'Callsign van het vliegtuig'})
   CALLSIGN?: string | null;

   @ApiProperty({type: String, required: false, description: 'Registratie en callsign van het vliegtuig'})
   REG_CALL?: string;

   @ApiProperty({type: Number, required: false, description: 'Aantal zitplaatsen in het vliegtuig'})
   ZITPLAATSEN?: number;

   @ApiProperty({type: Boolean, required: false, description: 'Is het vliegtuig eigendom van de club'})
   CLUBKIST?: boolean;

   @ApiProperty({type: String, required: false, description: 'Flarmcode van het vliegtuig'})
   FLARMCODE?: string | null;

   @ApiProperty({type: Number, required: false, description: 'Het type vliegtuig, relatie naar de types tabel'})
   TYPE_ID?: number | null;

   @ApiProperty({type: String, required: false, description: 'Omschrijving van het vliegtuig type'})
   VLIEGTUIGTYPE_OMS?: string | null;

   @ApiProperty({type: Boolean, required: false, description: 'Is het een Touring Motor Glider (TMG)'})
   TMG?: boolean;

   @ApiProperty({type: Boolean, required: false, description: 'Kan het vliegtuig zelfstarten'})
   ZELFSTART?: boolean;

   @ApiProperty({type: Boolean, required: false, description: 'Is het een motorvliegtuig die sleept'})
   SLEEPKIST?: boolean;

   @ApiProperty({type: Number, required: false, description: 'Sorteer volgorde van het vliegtuig'})
   VOLGORDE?: number | null;

   @ApiProperty({type: Boolean, required: false, description: 'Is het vliegtuig inzetbaar in het vliegbedrijf'})
   INZETBAAR?: boolean;

   @ApiProperty({type: Boolean, required: false, description: 'Is het vliegtuig een instructievliegtuig'})
   TRAINER?: boolean;

   @ApiProperty({type: String, required: false, description: 'Opmerkingen over het vliegtuig'})
   OPMERKINGEN?: string | null;

   @ApiProperty({type: String, required: false, description: 'Omschrijving van het vliegveld (VELD_ID)'})
   VELD?: string | null;

   @ApiProperty({type: Number, required: false, description: 'Is het vliegtuig momenteel aan het vliegen (1) of niet (0)'})
   VLIEGT?: number;
}