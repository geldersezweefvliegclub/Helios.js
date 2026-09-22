import {ApiProperty} from "@nestjs/swagger";

export class NieuwLidNummerResponse
{
   @ApiProperty({
      type: String,
      required: true,
      description: 'Het nieuw gegenereerde lidnummer: jaar (4 cijfers) + volgnummer (2 cijfers)',
   })
   LIDNR: string;
}
