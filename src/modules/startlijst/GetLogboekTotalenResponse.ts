import {ApiProperty, ApiTags} from "@nestjs/swagger";

// aantal starts per startmethode, zie GetLogboekTotalen() in class.Startlijst.inc.php
export class GetLogboekTotalenStartsResponse
{
   @ApiProperty({type: String, nullable: true, description: 'Omschrijving van de startmethode'})
   METHODE: string | null;

   @ApiProperty({type: "integer", format: "int32", description: 'Aantal starts met deze startmethode'})
   AANTAL: number;
}

// aantal starts en vliegtijd per vliegtuig, zie GetLogboekTotalen() in class.Startlijst.inc.php
export class GetLogboekTotalenVliegtuigResponse
{
   @ApiProperty({type: String, description: 'Registratie en callsign van het vliegtuig'})
   REG_CALL: string;

   @ApiProperty({type: "integer", format: "int32", description: 'Aantal starts op dit vliegtuig'})
   STARTS: number;

   @ApiProperty({type: String, description: 'Totale vliegtijd op dit vliegtuig (H:mm)'})
   VLIEGTIJD: string;
}

// totalen van het hele jaar, zie GetLogboekTotalen() in class.Startlijst.inc.php
export class GetLogboekTotalenJaarResponse
{
   @ApiProperty({type: "integer", format: "int32", description: 'Totaal aantal starts'})
   STARTS: number;

   @ApiProperty({type: "integer", format: "int32", description: 'Aantal instructiestarts (alleen voor instructeurs, anders 0)'})
   INSTRUCTIE_STARTS: number;

   @ApiProperty({type: String, description: 'Instructie-uren (H:mm)'})
   INSTRUCTIE_UREN: string;

   @ApiProperty({type: String, description: 'Totale vliegtijd (H:mm)'})
   VLIEGTIJD: string;
}

// logboek-totalen van een lid voor een heel jaar (standaard het huidige jaar)
@ApiTags('Startlijst')
export class GetLogboekTotalenResponse
{
   @ApiProperty({type: "integer", format: "int32", description: 'Aantal vluchten waarop de totalen gebaseerd zijn'})
   totaal: number;

   @ApiProperty({type: String, description: 'hash van de dataset'})
   hash: string;

   @ApiProperty({type: [GetLogboekTotalenStartsResponse], description: 'Aantal starts per startmethode'})
   starts: GetLogboekTotalenStartsResponse[];

   @ApiProperty({type: [GetLogboekTotalenVliegtuigResponse], description: 'Starts en vliegtijd per vliegtuig, clubkisten eerst'})
   vliegtuigen: GetLogboekTotalenVliegtuigResponse[];

   @ApiProperty({type: GetLogboekTotalenJaarResponse, description: 'Totalen van het hele jaar'})
   jaar: GetLogboekTotalenJaarResponse;
}
