import {ApiProperty} from "@nestjs/swagger";
import {IsBoolean, IsOptional, IsString} from "class-validator";
import {CreateHeliosDocumentDto} from "../../generated/nestjs-dto/create-heliosDocument.dto";

// uitbreiding van de gegenereerde DTO met de (niet-persistente) velden voor het uploaden van een bestand,
// zie class.Documenten.inc.php AddObject(): DOC_NAAM + BASE64_DOC worden opgeslagen als bestand op de
// server, waarna URL automatisch wordt gevuld met de locatie van het opgeslagen bestand
export class CreateHeliosDocumentRequest extends CreateHeliosDocumentDto
{
   @IsOptional()
   @IsString()
   @ApiProperty({
      required: false,
      description: 'Bestandsnaam van het document, in combinatie met BASE64_DOC wordt het bestand opgeslagen en wordt URL automatisch gevuld',
      type: String
   })
   DOC_NAAM?: string;

   @IsOptional()
   @IsString()
   @ApiProperty({
      required: false,
      description: 'Inhoud van het document, base64 gecodeerd, in combinatie met DOC_NAAM',
      type: String
   })
   BASE64_DOC?: string;

   @IsOptional()
   @IsBoolean()
   @ApiProperty({
      required: false,
      description: 'Indien expliciet false en er bestaat al een bestand met dezelfde naam, wordt de aanvraag geweigerd (409). Standaard mag een bestaand bestand overschreven worden',
      type: Boolean
   })
   OVERSCHRIJVEN?: boolean;
}
