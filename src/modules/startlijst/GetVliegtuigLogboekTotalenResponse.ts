import {ApiProperty, ApiTags} from "@nestjs/swagger";

// totalen van een enkele maand, zie GetVliegtuigLogboekTotalen() in class.Startlijst.inc.php
export class GetVliegtuigLogboekTotalenMaandResponse
{
   @ApiProperty({type: "integer", format: "int32", description: 'Maand (1-12)'})
   MAAND: number;

   @ApiProperty({type: "integer", format: "int32", description: 'Aantal vluchten in deze maand'})
   VLUCHTEN: number;

   @ApiProperty({type: "integer", format: "int32", description: 'Aantal lierstarts in deze maand voor dit vliegtuig'})
   LIERSTARTS: number;

   @ApiProperty({type: "integer", format: "int32", description: 'Aantal sleepstarts in deze maand voor dit vliegtuig'})
   SLEEPSTARTS: number;

   @ApiProperty({type: String, description: 'Totale vliegtijd van deze maand (HH:mm)'})
   VLIEGTIJD: string;

   @ApiProperty({type: String, description: 'Registratie en callsign van het vliegtuig, leeg als er deze maand niet gevlogen is'})
   REG_CALL: string;
}

// totalen van het hele jaar, zie GetVliegtuigLogboekTotalen() in class.Startlijst.inc.php
export class GetVliegtuigLogboekTotalenJaarResponse
{
   @ApiProperty({type: "integer", format: "int32", description: 'Aantal vluchten in dit jaar'})
   VLUCHTEN: number;

   @ApiProperty({type: "integer", format: "int32", description: 'Aantal lierstarts dit jaar voor dit vliegtuig'})
   LIERSTARTS: number;

   @ApiProperty({type: "integer", format: "int32", description: 'Aantal sleepstarts dit jaar voor dit vliegtuig'})
   SLEEPSTARTS: number;

   @ApiProperty({type: String, description: 'Totale vliegtijd van dit jaar (H(H)(H):mm)'})
   VLIEGTIJD: string;
}

// logboek-totalen van een vliegtuig, per maand, altijd 12 maanden voor het opgevraagde (of huidige) jaar
@ApiTags('Startlijst')
export class GetVliegtuigLogboekTotalenResponse
{
   @ApiProperty({type: "integer", format: "int32", description: 'Aantal maanden in de dataset (altijd 12)'})
   totaal: number;

   @ApiProperty({type: String, description: 'hash van de dataset'})
   hash: string;

   @ApiProperty({type: [GetVliegtuigLogboekTotalenMaandResponse], description: 'Totalen per maand, altijd 12 maanden (leeg gevuld als er niet gevlogen is)'})
   dataset: GetVliegtuigLogboekTotalenMaandResponse[];

   @ApiProperty({type: GetVliegtuigLogboekTotalenJaarResponse, description: 'Totalen van het hele jaar'})
   totalen: GetVliegtuigLogboekTotalenJaarResponse;
}
