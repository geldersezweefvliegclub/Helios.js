    /**
 * Vergelijkt de PHP en NestJS implementatie van de "AanwezigVliegtuigen" module.
 * Beide APIs moeten draaien (zie TESTING_PHP_* / TESTING_NESTJS_* in .env).
 *
 * Draai enkel deze module: npm run test:e2e -- test/modules/aanwezig-vliegtuigen
 * Draai alle modules: npm run test:e2e
 */

import {compareModule} from "../testing-utils/ModuleComparison";

// BEGIN/EIND_DATUM expliciet meegeven zodat GetObjects geen impliciete default (huidig jaar) gebruikt,
// die tussen PHP en NestJS kan verschillen.
// NIET_VERTROKKEN is de enige module-specifieke GetObjects optie, zie GetObjectsOperAanwezigVliegtuigenRequest.
compareModule({
    className: "AanwezigVliegtuigen",
    getObjectsParams: {
        BEGIN_DATUM: "2026-01-01",
        EIND_DATUM: "2026-12-31",
    },
    extraGetObjectsOptions: [
        {name: "NIET_VERTROKKEN", params: {NIET_VERTROKKEN: true}},
    ],
});