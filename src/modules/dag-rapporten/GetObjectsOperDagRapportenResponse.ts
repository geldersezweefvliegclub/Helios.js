
import {ApiTags} from "@nestjs/swagger";
import {OperDagRapportDto} from "../../generated/nestjs-dto/operDagRapport.dto";

@ApiTags('DagRapporten')
export class GetObjectsOperDagRapportenResponse extends OperDagRapportDto
{
   // hier komen de specifieke velden voor GetObjects
}