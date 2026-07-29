/**
 * Vergelijkt de PHP en NestJS implementatie van de "DagInfo" module.
 * Beide APIs moeten draaien (zie TESTING_PHP_* / TESTING_NESTJS_* in .env).
 *
 * Draai enkel deze module: npm run test:e2e -- test/modules/dag-info
 * Draai alle modules: npm run test:e2e
 */

import {compareModule} from "../testing-utils/ModuleComparison";

// BEGIN/EIND_DATUM expliciet meegeven zodat GetObjects geen impliciete default (huidig jaar) gebruikt,
// die tussen PHP en NestJS kan verschillen. DagInfo heeft verder geen module-specifieke GetObjects opties.
compareModule({
    className: "Daginfo",
    getObjectsParams: {
        BEGIN_DATUM: "2020-01-01",
        EIND_DATUM: "2026-12-31",
    },
});
