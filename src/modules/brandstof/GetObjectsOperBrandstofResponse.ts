
import {ApiProperty, ApiTags} from "@nestjs/swagger";
import {OperBrandstofDto} from "../../generated/nestjs-dto/operBrandstof.dto";

@ApiTags('Brandstof')
export class GetObjectsOperBrandstofResponse extends OperBrandstofDto
{
   // hier komen de specifieke velden voor GetObjects

   @ApiProperty({
      type: String,
      required: true,
      description: 'Soort brandstof',
   })
   BRANDSTOF_TYPE?: string
}