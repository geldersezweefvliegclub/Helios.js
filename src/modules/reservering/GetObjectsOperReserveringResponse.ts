import {ApiProperty, ApiTags} from "@nestjs/swagger";
import {OperReserveringDto} from "../../generated/nestjs-dto/operReservering.dto";

// deze velden komen uit de reservering_view in de PHP implementatie (join met ref_leden voor lid/invoerder en ref_vliegtuigen)
@ApiTags('Reservering')
export class GetObjectsOperReserveringResponse extends OperReserveringDto
{
   @ApiProperty({type: String, required: false, description: 'Naam van het lid dat de reservering heeft gemaakt'})
   NAAM?: string;

   @ApiProperty({type: Boolean, required: false, description: 'Wil het lid geen privacy gevoelige gegevens tonen'})
   PRIVACY?: boolean;

   @ApiProperty({type: String, required: false, description: 'Naam van het lid dat de reservering heeft ingevoerd'})
   INGEVOERD_DOOR?: string;

   @ApiProperty({type: String, required: false, description: 'Registratie van het gereserveerde vliegtuig'})
   REGISTRATIE?: string;

   @ApiProperty({type: String, required: false, description: 'Callsign van het gereserveerde vliegtuig'})
   CALLSIGN?: string | null;

   @ApiProperty({type: String, required: false, description: 'Registratie en callsign van het gereserveerde vliegtuig'})
   REG_CALL?: string;
}