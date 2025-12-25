import {Module} from '@nestjs/common';
import {AuthorisatieModule} from "../authorisatie/authorisatie.module";
import {HeliosCoreModule} from "../../core/helios.core.module";
import {StartlijstController} from "./startlijst.controller";
import {StartlijstService} from "./startlijst.service";

@Module({
    imports: [AuthorisatieModule, HeliosCoreModule],
    controllers: [StartlijstController],
    providers: [StartlijstService]
})
export class RoosterModule {}
