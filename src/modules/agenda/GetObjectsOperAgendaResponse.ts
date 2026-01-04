
import {ApiTags} from "@nestjs/swagger";
import {OperAgendaDto} from "../../generated/nestjs-dto-test/operAgenda.dto";

@ApiTags('Agenda')
export class GetObjectsOperAgendaResponse extends OperAgendaDto
{
   // hier komen de specifieke velden voor GetObjects
}