import {ApiProperty, ApiTags} from "@nestjs/swagger";

// een vliegdag met het aantal starts en de totale vliegtijd, zie GetVliegDagen() in class.Startlijst.inc.php
@ApiTags('Startlijst')
export class GetVliegDagenResponse
{
   @ApiProperty({type: String, format: "date", description: 'Datum'})
   DATUM: Date;

   @ApiProperty({type: "integer", format: "int32", description: 'Aantal starts op deze dag'})
   STARTS: number;

   @ApiProperty({type: String, nullable: true, description: 'Totale vliegtijd van deze dag (HH:mm), leeg als er geen vliegtijd te berekenen is'})
   VLIEGTIJD: string | null;
}
