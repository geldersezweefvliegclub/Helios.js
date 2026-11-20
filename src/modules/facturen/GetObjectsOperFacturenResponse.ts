
import {ApiTags} from "@nestjs/swagger";
import {FactuurResponse} from "./FactuurResponse";

@ApiTags('Facturen')
export class GetObjectsOperFacturenResponse extends FactuurResponse
{
   // hier komen de specifieke velden voor GetObjects
}