import {Injectable, Logger} from '@nestjs/common';
import {ConfigService} from "@nestjs/config";
import {safeStringify} from "../../core/helpers/LogHelper";

@Injectable()
export class DdwvService {
    private readonly logger = new Logger(DdwvService.name);

    constructor(private readonly configService: ConfigService) {
    }

    // is de datum een DDWV dag: DDWV staat aan, de datum valt binnen het DDWV seizoen (START t/m EIND, formaat "MM-DD")
    // en het is een doordeweekse dag, zie dagIsDDWV() in class.DDWV.inc.php
    DagIsDDWV(datum: Date): boolean {
        this.logger.verbose(`DdwvService.DagIsDDWV(${safeStringify({datum})})`);
        const ddwv = this.configService.get<{DDWV: boolean, START: string, EIND: string}>('ddwv');
        if (!ddwv?.DDWV) {
            this.logger.verbose(`DdwvService.DagIsDDWV() => false, geen DDWV`);
            return false;
        }

        // DATUM is een kalenderdatum (UTC middernacht), dus de UTC-velden gebruiken
        const dateValue = (datum.getUTCMonth() + 1) * 100 + datum.getUTCDate();
        const [startMaand, startDag] = ddwv.START.split('-').map(Number);
        const [eindMaand, eindDag] = ddwv.EIND.split('-').map(Number);

        const binnenSeizoen = dateValue >= startMaand * 100 + startDag && dateValue <= eindMaand * 100 + eindDag;
        const weekdag = datum.getUTCDay();          // 0 = zondag, 6 = zaterdag
        const result = binnenSeizoen && weekdag >= 1 && weekdag <= 5;
        this.logger.verbose(`DdwvService.DagIsDDWV() => ${safeStringify(result)}`);
        return result;
    }
}
