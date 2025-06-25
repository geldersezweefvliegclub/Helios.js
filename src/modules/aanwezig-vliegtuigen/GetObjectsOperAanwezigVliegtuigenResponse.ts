
import {ApiTags} from "@nestjs/swagger";
import {OperAanwezigVliegtuigDto} from "../../generated/nestjs-dto/operAanwezigVliegtuig.dto";

@ApiTags('AanwezigVliegtuigen')
export class GetObjectsOperAanwezigVliegtuigenResponse extends OperAanwezigVliegtuigDto
{
   // hier komen de specifieke velden voor GetObjects
}