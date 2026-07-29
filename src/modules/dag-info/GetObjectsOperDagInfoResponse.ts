
import {ApiProperty, ApiTags} from "@nestjs/swagger";
import {OperDagInfoDto} from "../../generated/nestjs-dto/operDagInfo.dto";

@ApiTags('Daginfo')
export class GetObjectsOperDagInfoResponse extends OperDagInfoDto
{
   // hier komen de specifieke velden voor GetObjects

   @ApiProperty({type: String, required: true, description: 'Code van het vliegveld (VELD_ID)'})
   VELD_CODE?: string | null;

   @ApiProperty({type: String, required: true, description: 'Omschrijving van het vliegveld (VELD_ID)'})
   VELD_OMS?: string | null;

   @ApiProperty({type: String, required: true, description: 'Code van de baan (BAAN_ID)'})
   BAAN_CODE?: string | null;

   @ApiProperty({type: String, required: true, description: 'Omschrijving van de baan (BAAN_ID)'})
   BAAN_OMS?: string | null;

   @ApiProperty({type: String, required: true, description: 'Code van de startmethode (STARTMETHODE_ID)'})
   STARTMETHODE_CODE?: string | null;

   @ApiProperty({type: String, required: true, description: 'Omschrijving van de startmethode (STARTMETHODE_ID)'})
   STARTMETHODE_OMS?: string | null;

   @ApiProperty({type: String, required: true, description: 'Code van het vliegveld (VELD_ID2)'})
   VELD_CODE2?: string | null;

   @ApiProperty({type: String, required: true, description: 'Omschrijving van het vliegveld (VELD_ID2)'})
   VELD_OMS2?: string | null;

   @ApiProperty({type: String, required: true, description: 'Code van de baan (BAAN_ID2)'})
   BAAN_CODE2?: string | null;

   @ApiProperty({type: String, required: true, description: 'Omschrijving van de baan (BAAN_ID2)'})
   BAAN_OMS2?: string | null;

   @ApiProperty({type: String, required: true, description: 'Code van de startmethode (STARTMETHODE_ID2)'})
   STARTMETHODE_CODE2?: string | null;

   @ApiProperty({type: String, required: true, description: 'Omschrijving van de startmethode (STARTMETHODE_ID2)'})
   STARTMETHODE_OMS2?: string | null;
}