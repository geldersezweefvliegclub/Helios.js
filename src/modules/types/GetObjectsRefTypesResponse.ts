import {RefTypeDto} from "../../generated/nestjs-dto/refType.dto";
import {ApiProperty} from "@nestjs/swagger";

export class GetObjectsRefTypesReponse extends RefTypeDto
{
   // hier komen de specifieke velden voor GetObjects

   @ApiProperty({
      type: String,
      required: true,
      description: 'De groep waar dit type bij hoort',
   })
   GROEP?: string
}