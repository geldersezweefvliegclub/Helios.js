import {ApiProperty} from "@nestjs/swagger";

// een competentie met (indien aanwezig) de progressie van een specifiek lid erop geplakt, zie ProgressieKaart()
// in class.Progressie.inc.php. Wordt gebruikt door zowel ProgressieKaart als ProgressieBoom. Losstaand van
// GetObjectsRefCompetentiesResponse omdat RefCompetentie zelf ook een (ander) SCORE veld heeft.
export class ProgressieKaartResponse
{
   @ApiProperty({type: Number, description: 'ID van de competentie'})
   ID: number;

   @ApiProperty({type: Number, required: false, nullable: true, description: 'ID van de bovenliggende competentie'})
   OUDER_ID?: number | null;

   @ApiProperty({type: Number, description: 'Leerfase ID van de competentie'})
   LEERFASE_ID: number;

   @ApiProperty({type: String, required: false, description: 'Omschrijving van de leerfase'})
   LEERFASE?: string | null;

   @ApiProperty({type: Number, required: false, description: 'Sorteervolgorde van de competentie'})
   VOLGORDE?: number;

   @ApiProperty({type: String, description: 'Omschrijving van de competentie'})
   OMSCHRIJVING: string;

   @ApiProperty({type: String, required: false, nullable: true, description: 'Documentatie/uitleg bij de competentie'})
   DOCUMENTATIE?: string | null;

   @ApiProperty({type: Number, required: false, nullable: true, description: 'ID van het progressie record, null als de competentie nog niet behaald is'})
   PROGRESSIE_ID?: number | null;

   @ApiProperty({type: String, required: false, nullable: true, description: 'Naam van de instructeur die de competentie heeft afgetekend'})
   INSTRUCTEUR_NAAM?: string | null;

   @ApiProperty({type: Date, required: false, nullable: true, description: 'Tijdstip waarop de competentie is afgetekend'})
   INGEVOERD?: Date | null;

   @ApiProperty({type: Number, required: false, nullable: true, description: 'Score van de competentie (1 t/m 5)'})
   SCORE?: number | null;

   @ApiProperty({type: Date, required: false, nullable: true, description: 'Tot wanneer de competentie geldig is'})
   GELDIG_TOT?: Date | null;

   @ApiProperty({type: String, required: false, nullable: true, description: 'Opmerkingen bij het behalen van de competentie'})
   OPMERKINGEN?: string | null;

   @ApiProperty({
      description: "Afgeleide competenties",
      type: () => ProgressieKaartResponse
   })
   children?: ProgressieKaartResponse[];
}