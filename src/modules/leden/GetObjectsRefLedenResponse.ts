
import {RefLidDto} from "../../generated/nestjs-dto/refLid.dto";
import {ApiProperty} from "@nestjs/swagger";

export class GetObjectsRefLedenResponse extends RefLidDto
{
   @ApiProperty({
      type: String,
      required: true,
      description: 'Lidtype',
   })
   LIDTYPE?: string

   @ApiProperty({
      type: String,
      required: true,
      description: 'Externe referentie naar het lidtype',
   })
   LIDTYPE_REF: string

   @ApiProperty({
      type: String,
      required: true,
      description: 'Vliegstatus van het lid',
   })
   STATUS: string

   @ApiProperty({
      type: String,
      required: true,
      description: 'Van welke zusterclub is het lid nog meer lid',
   })
   ZUSTERCLUB: string

   @ApiProperty({
      type: String,
      required: true,
      description: 'Naam van de 1e buddy',
   })
   BUDDY: string

   @ApiProperty({
      type: String,
      required: true,
      description: 'Naam van de 2e buddy',
   })
   BUDDY2: string
}