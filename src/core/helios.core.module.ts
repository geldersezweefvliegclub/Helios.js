import {Module} from '@nestjs/common';
import {DbService} from "../database/db-service/db.service";
import {MqttService} from "./services/mqtt.service";
import {MqttEventsListener} from "./services/mqtt-events.listener";

@Module({
    providers: [
        DbService,
        MqttService,
        MqttEventsListener,     // publiceert alle database wijzigingen op helios/events
    ],
    exports: [
        DbService,
        MqttService,
    ]
})
export class HeliosCoreModule {
}