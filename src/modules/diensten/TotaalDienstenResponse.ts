import {ApiProperty} from "@nestjs/swagger";

// Response voor Diensten/TotaalDiensten, zie TotaalDiensten() in class.Diensten.inc.php - per lid een rij
// per maand, gevolgd door een jaartotaal-rij (MAAND: null) voor dat lid
export class TotaalDienstenResponse {
   @ApiProperty({type: Number, nullable: true, description: 'ID van het lid'})
   LID_ID: number | null;

   @ApiProperty({type: String, nullable: true, description: 'Naam van het lid'})
   NAAM: string | null;

   @ApiProperty({type: Number, description: 'Jaartal waarover de telling gaat'})
   JAAR: number;

   @ApiProperty({type: Number, nullable: true, description: 'Maand (1-12), of null voor de jaartotaal-rij van dit lid'})
   MAAND: number | null;

   @ApiProperty({type: Number, description: 'Aantal diensten in deze maand, of het jaartotaal wanneer MAAND null is'})
   AANTAL: number;
}
