
import {ApiTags} from "@nestjs/swagger";
import {OperFactuurDto} from "../../generated/nestjs-dto/operFactuur.dto";

@ApiTags('Facturen')
export class GetObjectsOperFacturenResponse extends OperFactuurDto
{
   // hier komen de specifieke velden voor GetObjects
}