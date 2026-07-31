
import {ApiProperty, ApiTags} from "@nestjs/swagger";
import {OperDagRapportDto} from "../../generated/nestjs-dto/operDagRapport.dto";

// deze velden komen uit de dagrapport_view in de PHP implementatie (join met ref_types voor het veld en ref_leden voor de invoerder)
@ApiTags('DagRapporten')
export class GetObjectsOperDagRapportenResponse extends OperDagRapportDto
{
   @ApiProperty({type: String, required: false, description: 'Naam van het lid dat het dagrapport heeft ingevoerd'})
   INGEVOERD?: string;

   @ApiProperty({type: String, required: false, description: 'Code van het vliegveld (VELD_ID)'})
   VELD_CODE?: string | null;

   @ApiProperty({type: String, required: false, description: 'Omschrijving van het vliegveld (VELD_ID)'})
   VELD_OMS?: string | null;
}