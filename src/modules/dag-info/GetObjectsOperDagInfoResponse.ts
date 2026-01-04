
import {ApiTags} from "@nestjs/swagger";
import {OperDagInfoDto} from "../../generated/nestjs-dto-test/operDagInfo.dto";

@ApiTags('DagInfo')
export class GetObjectsOperDagInfoResponse extends OperDagInfoDto
{
   // hier komen de specifieke velden voor GetObjects
}