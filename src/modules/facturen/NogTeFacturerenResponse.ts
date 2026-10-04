import {ApiProperty} from "@nestjs/swagger";
import {RefLidDto} from "../../generated/nestjs-dto/refLid.dto";

// zie NogTeFactureren() in class.Facturen.inc.php: leden-record aangevuld met afgeleide velden
export class NogTeFacturerenResponse extends RefLidDto
{
   @ApiProperty({
      type: Number,
      required: false,
      nullable: true,
      description: 'Leeftijd van het lid op 1 januari van het opgevraagde jaar'
   })
   LEEFTIJD: number | null;

   @ApiProperty({
      type: String,
      required: false,
      nullable: true,
      description: 'Omschrijving van het lidmaatschapstype'
   })
   LIDMAATSCHAP: string | null;

   @ApiProperty({
      type: Number,
      required: false,
      nullable: true,
      description: 'Contributiebedrag behorend bij het lidmaatschapstype'
   })
   CONTRIBUTIE: number | null;
}
