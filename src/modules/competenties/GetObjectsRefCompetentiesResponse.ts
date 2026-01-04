
import {ApiProperty} from "@nestjs/swagger";
import {RefCompetentieDto} from "../../generated/nestjs-dto/refCompetentie.dto";

export class GetObjectsRefCompetentiesResponse extends RefCompetentieDto
{
   // hier komen de specifieke velden voor GetObjects

   @ApiProperty({
      type: String,
      required: true,
      description: 'Omschrijving van de leerfase uit type tabel',
   })
   LEERFASE?: string
}