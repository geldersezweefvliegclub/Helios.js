
import {ApiTags} from "@nestjs/swagger";
import {OperRoosterDto} from "../../generated/nestjs-dto/operRooster.dto";

@ApiTags('Rooster')
export class GetObjectsOperRoosterResponse extends OperRoosterDto
{
   // hier komen de specifieke velden voor GetObjects
}