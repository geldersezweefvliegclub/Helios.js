import {ApiProperty} from "@nestjs/swagger";

// vliegcurrency-statistieken van een lid, zie Startlijst.GetRecency() in de PHP implementatie
export class RecencyResponse
{
   @ApiProperty({type: "integer", format: "int32", description: "Aantal starts in de laatste 13 weken"})
   STARTS_DRIE_MND: number;

   @ApiProperty({type: "integer", format: "int32", description: "Aantal starts in de laatste 104 weken"})
   STARTS_24_MND: number;

   @ApiProperty({type: "integer", format: "int32", description: "Aantal starts in het vorige kalenderjaar"})
   STARTS_VORIG_JAAR: number;

   @ApiProperty({type: "integer", format: "int32", description: "Aantal starts in het huidige kalenderjaar"})
   STARTS_DIT_JAAR: number;

   @ApiProperty({type: "integer", format: "int32", description: "Aantal instructiestarts in de laatste 3 jaar, -1 als dit lid geen instructeur is"})
   STARTS_INSTRUCTIE: number;

   @ApiProperty({type: String, description: "Vlieguren in de laatste 13 weken, formaat H:MM"})
   UREN_DRIE_MND: string;

   @ApiProperty({type: String, description: "Vlieguren in de laatste 104 weken, formaat H:MM"})
   UREN_24_MND: string;

   @ApiProperty({type: String, description: "Vlieguren in het vorige kalenderjaar, formaat H:MM"})
   UREN_VORIG_JAAR: string;

   @ApiProperty({type: String, description: "Vlieguren in het huidige kalenderjaar, formaat H:MM"})
   UREN_DIT_JAAR: string;

   @ApiProperty({type: String, description: "Instructie-vlieguren in de laatste 3 jaar, formaat H:MM"})
   UREN_INSTRUCTIE: string;

   @ApiProperty({type: String, description: "rood, geel of groen"})
   STATUS_BAROMETER: string;

   @ApiProperty({type: "number", format: "float", description: "Barometerwaarde, afgerond op 1 decimaal"})
   WAARDE: number;

   @ApiProperty({type: "integer", format: "int32", description: "Aantal starts in de laatste 26 weken"})
   STARTS_BAROMETER: number;

   @ApiProperty({type: String, description: "Vlieguren in de laatste 26 weken, formaat H:MM"})
   UREN_BAROMETER: string;

   @ApiProperty({type: "integer", format: "int32", description: "Aantal lierstarts in de laatste 104 weken"})
   LIERSTARTS: number;

   @ApiProperty({type: "integer", format: "int32", description: "Aantal sleepstarts in de laatste 104 weken"})
   SLEEPSTARTS: number;

   @ApiProperty({type: "integer", format: "int32", description: "Aantal zelfstarts in de laatste 104 weken"})
   ZELFSTARTS: number;

   @ApiProperty({type: "integer", format: "int32", description: "Aantal TMG-starts in de laatste 104 weken"})
   TMGSTARTS: number;

   @ApiProperty({type: [String], description: "Datums (dd-mm-jjjj) van checkstarts als vlieger in de laatste 104 weken"})
   CHECKS: string[];
}
