
import {ApiProperty} from "@nestjs/swagger";
import {RefVliegtuigDto} from "../../generated/nestjs-dto/refVliegtuig.dto";

export class GetObjectsRefVliegtuigenResponse extends RefVliegtuigDto
{
   // hier komen de specifieke velden voor GetObjects

   @ApiProperty({
      type: String,
      required: true,
      description: 'Omschrijving van het vliegtuig type',
   })
   VLIEGTUIGTYPE?: string

   @ApiProperty({
      type: String,
      required: false,
      description: 'Omschrijving om vliegtuig lokaal te mogen vliegen',
   })
   BEVOEGDHEID_LOKAAL?: string

   @ApiProperty({
      type: String,
      required: false,
      description: 'Omschrijving om met vliegtuig overland te gaan',
   })
   BEVOEGDHEID_OVERLAND?: string

   @ApiProperty({
      type: Number,
      required: false,      //TODO: moet true worden als journaal aanwezig is
      description: 'Aantal uitstaande journaals',
   })
   JOURNAAL_AANTAL?: number
}