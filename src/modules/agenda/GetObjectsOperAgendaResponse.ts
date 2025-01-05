
import {ApiTags} from "@nestjs/swagger";
import {OperAgendaDto} from "../../generated/nestjs-dto/operAgenda.dto";

@ApiTags('Brandstof')
export class GetObjectsOperAgendaResponse extends OperAgendaDto
{
   // hier komen de specifieke velden voor GetObjects
}