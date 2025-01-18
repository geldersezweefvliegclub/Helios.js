
import {ApiProperty, ApiTags} from "@nestjs/swagger";
import {OperBrandstofDto} from "../../generated/nestjs-dto/operBrandstof.dto";
import {HeliosDocumentDto} from "../../generated/nestjs-dto/heliosDocument.dto";

@ApiTags('Documenten')
export class GetObjectsHeliosDocumentenResponse extends HeliosDocumentDto
{
   // hier komen de specifieke velden voor GetObjects

   @ApiProperty({
      type: String,
      required: true,
      description: 'Naam van het lid',
   })
   NAAM?: string

   @ApiProperty({
      type: String,
      required: true,
      description: 'In welke groep hoort dit document',
   })
   GROEP: string
}