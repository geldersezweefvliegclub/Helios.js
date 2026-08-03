import {Controller, Get, Logger, UseGuards} from '@nestjs/common';
import {HeliosController} from "../../core/controllers/helios/helios.controller";
import {ApiBearerAuth, ApiTags} from "@nestjs/swagger";
import {DDWVConfiguratie} from "./ddwvDTO";
import {JwtAuthGuard} from "../login/guards/jwt-auth.guard";

@Controller('DDWV')
@ApiTags('DDWV')
export class DdwvController extends HeliosController {
    private readonly logger = new Logger(DdwvController.name);

    @Get('GetConfiguratie')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async getConfiguratie(): Promise<DDWVConfiguratie> {
        this.logger.verbose(`DdwvController.getConfiguratie()`);
        // TODO: dit implementeren!
        this.logger.warn("DDWV configuratie endpoint called, but not implemented yet.");
        return {
            DDWV: false,
            EIND: new Date().toISOString(),
            MAX_STRIPPEN: 0,
            START: new Date().toISOString(),
            STRIPPEN_RETOUR_OP_VLIEGDAG: 0
        };
    }
}
