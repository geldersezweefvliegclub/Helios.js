
import {ApiProperty, ApiTags} from "@nestjs/swagger";
import {TransactieResponse} from "./TransactieResponse";

@ApiTags('Transacties')
export class GetObjectsOperTransactiesResponse extends TransactieResponse
{
   // hier komen de specifieke velden voor GetObjects

   @ApiProperty({type: String, required: true, description: 'Naam van het lid waarop de transactie betrekking heeft'})
   NAAM?: string | null;

   @ApiProperty({type: String, required: true, description: 'Naam van het lid dat de transactie heeft ingevoerd'})
   INGEVOERD?: string | null;

   @ApiProperty({type: String, required: true, description: 'Omschrijving van het type transactie'})
   TYPE?: string | null;
}