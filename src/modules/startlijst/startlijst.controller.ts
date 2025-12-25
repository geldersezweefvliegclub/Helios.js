import {Controller, Get} from '@nestjs/common';
import {HeliosController} from "../../core/controllers/helios/helios.controller";
import {ApiTags} from "@nestjs/swagger";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {VliegdagDto} from "./VliegdagDto";
import {StartlijstService} from "./startlijst.service";

@Controller('Startlijst')
@ApiTags('Startlijst')
export class StartlijstController  extends HeliosController
{

    constructor(private readonly startlijstService: StartlijstService) {
        super();
    }

    @Get("GetVliegDagen")
    async getVliegdagen(): Promise<IHeliosGetObjectsResponse<VliegdagDto>> {
        return this.startlijstService.getVliegdagen();
    }
}