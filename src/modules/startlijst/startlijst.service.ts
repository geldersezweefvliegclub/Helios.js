import {Injectable} from "@nestjs/common";
import {IHeliosService} from "../../core/services/IHeliosService";
import {IHeliosGetObjectsResponse} from "../../core/DTO/IHeliosGetObjectsResponse";
import {VliegdagDto} from "./VliegdagDto";
import {DbService} from "../../database/db-service/db.service";
import {EventEmitter2} from "@nestjs/event-emitter";

@Injectable()
export class StartlijstService extends IHeliosService {

    constructor(private readonly dbService: DbService,
                private readonly eventEmitter: EventEmitter2)
    {
        super();
    }

    async getVliegdagen(): Promise<IHeliosGetObjectsResponse<VliegdagDto>> {

    }
}