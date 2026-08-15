import {Module} from '@nestjs/common';
import {DbService} from "../database/db-service/db.service";

@Module({
    providers: [
        DbService,
    ],
    exports: [
        DbService,
    ]
})
export class HeliosCoreModule {
}