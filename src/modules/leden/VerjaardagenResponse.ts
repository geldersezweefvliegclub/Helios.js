import {ApiProperty} from "@nestjs/swagger";

export class VerjaardagenResponse
{
   @ApiProperty({
      type: String,
      required: true,
      description: 'Naam van het lid',
   })
   NAAM: string;

   @ApiProperty({
      type: "integer",
      format: "int32",
      description: 'Dag van de maand',
   })
   DAG: number;

   @ApiProperty({
      type: "integer",
      format: "int32",
      description: 'De maand',
   })
   MAAND: number;

   @ApiProperty({
      type: "integer",
      format: "int32",
      required: false,
      description: 'De leeftijd van het lid, ontbreekt als de gebruiker PRIVACY aan heeft',
   })
   LEEFTIJD?: number;
}