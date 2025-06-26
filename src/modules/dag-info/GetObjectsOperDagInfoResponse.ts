
import {ApiTags} from "@nestjs/swagger";
import {OperDagInfoDto} from "../../generated/nestjs-dto/operDagInfo.dto";

@ApiTags('DagInfo')
export class GetObjectsOperDagInfoResponse extends OperDagInfoDto
{
   // hier komen de specifieke velden voor GetObjects
}