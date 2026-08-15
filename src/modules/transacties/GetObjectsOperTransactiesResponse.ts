
import {ApiProperty, ApiTags} from "@nestjs/swagger";
import {OperTransactieDto} from "../../generated/nestjs-dto/operTransactie.dto";

@ApiTags('Transacties')
export class GetObjectsOperTransactiesResponse extends OperTransactieDto
{
   // hier komen de specifieke velden voor GetObjects

   @ApiProperty({type: String, required: true, description: 'Naam van het lid waarop de transactie betrekking heeft'})
   NAAM?: string | null;

   @ApiProperty({type: String, required: true, description: 'Naam van het lid dat de transactie heeft ingevoerd'})
   INGEVOERD?: string | null;

   @ApiProperty({type: String, required: true, description: 'Omschrijving van het type transactie'})
   TYPE?: string | null;
}