
import {ApiTags} from "@nestjs/swagger";
import {OperDagInfoDto} from "../../generated/nestjs-dto/operDagInfo.dto";

@ApiTags('Winterwerk')
export class GetObjectsOperDagInfoResponse extends OperDagInfoDto
{
   // hier komen de specifieke velden voor GetObjects
}