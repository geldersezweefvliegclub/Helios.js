import {ApiProperty, ApiTags} from "@nestjs/swagger";
import {OperStartlijstDto} from "../../generated/nestjs-dto/operStartlijst.dto";

// deze velden komen uit de startlijst_view in de PHP implementatie (join met ref_vliegtuigen, ref_leden, ref_types,
// oper_daginfo en oper_rooster), zie CreateViews() in class.Startlijst.inc.php
@ApiTags('Startlijst')
export class GetObjectsOperStartlijstResponse extends OperStartlijstDto
{
   @ApiProperty({type: String, required: false, description: 'Registratie van het vliegtuig'})
   REGISTRATIE?: string;

   @ApiProperty({type: String, required: false, description: 'Callsign van het vliegtuig'})
   CALLSIGN?: string | null;

   @ApiProperty({type: String, required: false, description: 'Registratie en callsign van het vliegtuig'})
   REG_CALL?: string;

   @ApiProperty({type: Boolean, required: false, description: 'Is het vliegtuig eigendom van de club'})
   CLUBKIST?: boolean;

   @ApiProperty({type: Number, required: false, description: 'Type ID van het vliegtuig'})
   VLIEGTUIG_TYPE_ID?: number | null;

   @ApiProperty({type: String, required: false, description: 'Omschrijving van het vliegtuigtype'})
   VLIEGTUIGTYPE?: string | null;

   @ApiProperty({type: String, required: false, description: 'Registratie en callsign van het sleepvliegtuig'})
   SLEEPKIST?: string | null;

   @ApiProperty({type: String, required: false, description: 'Naam van de vlieger (uit ledenbestand)'})
   VLIEGERNAAM_LID?: string | null;

   @ApiProperty({type: String, required: false, description: 'Naam van de inzittende (uit ledenbestand)'})
   INZITTENDENAAM_LID?: string | null;

   @ApiProperty({type: Number, required: false, description: 'Lidtype ID van de vlieger'})
   VLIEGER_LIDTYPE_ID?: number | null;

   @ApiProperty({type: Number, required: false, description: 'Lidtype ID van de inzittende'})
   INZITTENDE_LIDTYPE_ID?: number | null;

   @ApiProperty({type: String, required: false, description: 'Omschrijving van de startmethode'})
   STARTMETHODE?: string | null;

   @ApiProperty({type: String, required: false, description: 'Omschrijving van het vliegveld (VELD_ID)'})
   VELD?: string | null;

   @ApiProperty({type: String, required: false, description: 'Code van de baan (BAAN_ID)'})
   BAAN?: string | null;

   @ApiProperty({type: String, required: false, description: 'Vliegduur (HH:mm), leeg als de vlucht nog niet geland is en niet vandaag was'})
   DUUR?: string;

   @ApiProperty({type: Boolean, required: false, description: 'Is deze vliegdag een DDWV dag (via daginfo of rooster)'})
   DDWV?: boolean;
}