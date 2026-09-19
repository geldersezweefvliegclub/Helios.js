import {ApiProperty, ApiTags} from "@nestjs/swagger";

// een gevlogen dag van een vliegtuig, zie GetVliegtuigLogboek() in class.Startlijst.inc.php
@ApiTags('Startlijst')
export class GetVliegtuigLogboekResponse
{
   @ApiProperty({type: String, format: "date", description: 'Datum'})
   DATUM: Date;

   @ApiProperty({type: "integer", format: "int32", description: 'Aantal vluchten van deze dag'})
   VLUCHTEN: number;

   @ApiProperty({type: "integer", format: "int32", description: 'Aantal lierstarts van deze dag voor dit vliegtuig'})
   LIERSTARTS: number;

   @ApiProperty({type: "integer", format: "int32", description: 'Aantal sleepstarts van deze dag voor dit vliegtuig'})
   SLEEPSTARTS: number;

   @ApiProperty({type: String, description: 'Totale vliegtijd van deze dag (HH:mm)'})
   VLIEGTIJD: string;

   @ApiProperty({type: String, description: 'Registratie en callsign van het vliegtuig'})
   REG_CALL: string;
}
