import {Controller} from '@nestjs/common';
import {HeliosController} from "../../core/controllers/helios/helios.controller";
import {ApiTags} from "@nestjs/swagger";

@Controller('DDWV')
@ApiTags('DDWV')
export class DdwvController extends HeliosController {
}
