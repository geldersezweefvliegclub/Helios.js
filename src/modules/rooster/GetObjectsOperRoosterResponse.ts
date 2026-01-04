
import {ApiTags} from "@nestjs/swagger";
import {OperRoosterDto} from "../../generated/nestjs-dto-test/operRooster.dto";

@ApiTags('Rooster')
export class GetObjectsOperRoosterResponse extends OperRoosterDto
{
   // hier komen de specifieke velden voor GetObjects
}