import {ApiProperty} from "@nestjs/swagger";

export class HeeftCompetentieResponse
{
   @ApiProperty({
      type: [Number],
      required: true,
      description: 'Lid IDs die een (niet-verwijderd) progressie record hebben voor de opgegeven competentie',
   })
   LID_IDS: number[];
}
