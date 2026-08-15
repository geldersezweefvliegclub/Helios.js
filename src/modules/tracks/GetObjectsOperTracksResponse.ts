import {ApiProperty, ApiTags} from "@nestjs/swagger";
import {OperTrackDto} from "../../generated/nestjs-dto/operTrack.dto";

// deze velden komen uit de tracks_view in de PHP implementatie (join met ref_leden voor lid en instructeur)
@ApiTags('Tracks')
export class GetObjectsOperTracksResponse extends OperTrackDto
{
   @ApiProperty({type: String, required: false, description: 'Naam van het lid waarover de track gaat'})
   LID_NAAM?: string;

   @ApiProperty({type: String, required: false, description: 'Naam van de instructeur die de track heeft ingevoerd'})
   INSTRUCTEUR_NAAM?: string | null;
}