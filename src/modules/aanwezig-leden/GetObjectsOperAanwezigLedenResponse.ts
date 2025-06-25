
import {ApiTags} from "@nestjs/swagger";
import {OperAanwezigLidDto} from "../../generated/nestjs-dto/operAanwezigLid.dto";

@ApiTags('DagRapporten')
export class GetObjectsOperAanwezigLedenResponse extends OperAanwezigLidDto
{
   // hier komen de specifieke velden voor GetObjects
}