import {ApiProperty, ApiTags, OmitType} from "@nestjs/swagger";
import {OperFactuurDto} from "../../generated/nestjs-dto/operFactuur.dto";

// een factuur zoals de API die teruggeeft: gelijk aan OperFactuurDto, maar GEFACTUREERD is een getal in plaats van
// een Prisma Decimal string (zie ook TransactieResponse). Als string toont Pegasus het bedrag niet in het grid
@ApiTags('Facturen')
export class FactuurResponse extends OmitType(OperFactuurDto, ['GEFACTUREERD'] as const)
{
   @ApiProperty({type: Number, nullable: true, description: 'Bedrag wat gefactureerd is'})
   GEFACTUREERD: number | null;
}
