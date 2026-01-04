
import {ApiTags} from "@nestjs/swagger";
import {OperTransactieDto} from "../../generated/nestjs-dto-test/operTransactie.dto";

@ApiTags('Transacties')
export class GetObjectsOperTransactiesResponse extends OperTransactieDto
{
   // hier komen de specifieke velden voor GetObjects
}