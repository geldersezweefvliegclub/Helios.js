import {Module} from '@nestjs/common';
import {DbService} from "../database/db-service/db.service";
import {MqttService} from "./services/mqtt.service";

@Module({
    providers: [
        DbService,
        MqttService,
    ],
    exports: [
        DbService,
        MqttService,
    ]
})
export class HeliosCoreModule {
}