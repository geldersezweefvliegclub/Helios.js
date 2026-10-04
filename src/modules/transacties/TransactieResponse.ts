import {ApiProperty, ApiTags, OmitType} from "@nestjs/swagger";
import {OperTransactieDto} from "../../generated/nestjs-dto/operTransactie.dto";

// een transactie zoals de API die teruggeeft: gelijk aan OperTransactieDto, maar BEDRAG, SALDO_VOOR en SALDO_NA zijn
// getallen in plaats van Prisma Decimal strings, zoals in de PHP implementatie (RecordToOutput() in class.Transacties.inc.php)
@ApiTags('Transacties')
export class TransactieResponse extends OmitType(OperTransactieDto, ['BEDRAG', 'SALDO_VOOR', 'SALDO_NA'] as const)
{
   @ApiProperty({type: Number, nullable: true, description: 'Het bedrag wat gefactureerd wordt per eenheid'})
   BEDRAG: number | null;

   @ApiProperty({type: Number, nullable: true, description: 'Aantal strippen voordat de transactie verwerkt is'})
   SALDO_VOOR: number | null;

   @ApiProperty({type: Number, nullable: true, description: 'Aantal strippen NA de transactie, dus het nieuwe saldo'})
   SALDO_NA: number | null;
}
