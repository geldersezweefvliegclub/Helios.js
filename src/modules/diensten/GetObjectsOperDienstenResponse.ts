
import {ApiTags} from "@nestjs/swagger";
import {OperDienstDto} from "../../generated/nestjs-dto/operDienst.dto";

@ApiTags('DagRapporten')
export class GetObjectsOperDienstenResponse extends OperDienstDto
{
   // hier komen de specifieke velden voor GetObjects
}