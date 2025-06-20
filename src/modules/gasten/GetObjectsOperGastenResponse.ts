
import {ApiTags} from "@nestjs/swagger";
import {OperGastDto} from "../../generated/nestjs-dto/operGast.dto"

@ApiTags('Gasten')
export class GetObjectsOperGastenResponse extends OperGastDto
{
   // hier komen de specifieke velden voor GetObjects
}