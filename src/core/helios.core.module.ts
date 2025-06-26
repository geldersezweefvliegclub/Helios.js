import {Logger, Module} from '@nestjs/common';
import {DbService} from "../database/db-service/db.service";

@Module({
    providers: [
        DbService,
        Logger
    ],
    exports: [
        DbService,
        Logger
    ]
})
export class HeliosCoreModule {
}