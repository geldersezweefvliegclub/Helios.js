/**
 * Vergelijkt de PHP en NestJS implementatie van de "DagRapporten" module.
 * Beide APIs moeten draaien (zie TESTING_PHP_* / TESTING_NESTJS_* in .env).
 *
 * Draai enkel deze module: npm run test:e2e -- test/modules/dag-rapporten
 * Draai alle modules: npm run test:e2e
 */

import {compareModule} from "../testing-utils/ModuleComparison";

// BEGIN/EIND_DATUM expliciet meegeven zodat GetObjects geen impliciete default (huidig jaar) gebruikt,
// die tussen PHP en NestJS kan verschillen. DagRapporten heeft verder geen module-specifieke GetObjects opties,
// zie route.DagRapporten.php / class.DagRapporten.inc.php.
compareModule({
    className: "DagRapporten",
    getObjectsParams: {
        BEGIN_DATUM: "2020-01-01",
        EIND_DATUM: "2026-12-31",
    },
});