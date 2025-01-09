
import {ApiProperty} from "@nestjs/swagger";
import {OperJournaalDto} from "../../generated/nestjs-dto/operJournaal.dto";

export class GetObjectsOperJournaalResponse extends OperJournaalDto
{
   @ApiProperty({
      type: String,
      required: true,
      description: 'Beschrijving rollend materieel',
   })
   ROLLEND?: string

   @ApiProperty({
      type: String,
      required: true,
      description: 'Registratie & callsign van het vliegtuig',
   })
   REG_CALL: string

   @ApiProperty({
      type: String,
      required: true,
      description: 'Status van de melding',
   })
   STATUS: string

   @ApiProperty({
      type: String,
      required: true,
      description: 'Categorie van de melding (Visueel, Klacht, Algemeen, Defect, etc)',
   })
   CATEGORIE: string

   @ApiProperty({
      type: String,
      required: true,
      description: 'Verkorte code voor de cathegorie van de melding',
   })
   CATEGORIE_CODE: string

   @ApiProperty({
      type: String,
      required: true,
      description: 'Naam van de persoon die de melding gedaan heeft',
   })
   MELDER: string

   @ApiProperty({
      type: String,
      required: true,
      description: 'Naam van de technicus die de melding onder beheer heeft',
   })
   TECHNICUS: string

   @ApiProperty({
      type: String,
      required: true,
      description: 'Naam van de persoon die de melding heeft afgetekend',
   })
   AFGETEKEND: string
}