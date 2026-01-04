
import {ApiTags} from "@nestjs/swagger";
import {OperAanwezigLidDto} from "../../generated/nestjs-dto-test/operAanwezigLid.dto";

@ApiTags('AanwezigLeden')
export class GetObjectsOperAanwezigLedenResponse extends OperAanwezigLidDto
{
   // hier komen de specifieke velden voor GetObjects
}