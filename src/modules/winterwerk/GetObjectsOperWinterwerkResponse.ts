
import {ApiTags} from "@nestjs/swagger";
import {OperWinterwerkDto} from "../../generated/nestjs-dto/operWinterwerk.dto";

@ApiTags('Winterwerk')
export class GetObjectsOperWinterwerkResponse extends OperWinterwerkDto
{
   // hier komen de specifieke velden voor GetObjects
}