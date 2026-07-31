import {ApiProperty, ApiTags} from "@nestjs/swagger";
import {OperProgressieDto} from "../../generated/nestjs-dto/operProgressie.dto";

// deze velden komen uit de progressie_view in de PHP implementatie (join met ref_competenties, ref_leden en ref_types)
@ApiTags('Progressie')
export class GetObjectsOperProgressieResponse extends OperProgressieDto
{
   @ApiProperty({type: Number, required: false, description: 'Leerfase ID van de competentie'})
   LEERFASE_ID?: number;

   @ApiProperty({type: String, required: false, description: 'Omschrijving van de leerfase'})
   LEERFASE?: string | null;

   @ApiProperty({type: String, required: false, description: 'Omschrijving van de competentie'})
   COMPETENTIE?: string;

   @ApiProperty({type: String, required: false, description: 'Naam van het lid'})
   LID_NAAM?: string;

   @ApiProperty({type: String, required: false, description: 'Naam van de instructeur die de progressie heeft afgetekend'})
   INSTRUCTEUR_NAAM?: string;
}