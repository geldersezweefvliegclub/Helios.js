/**
 * Vergelijkt de PHP en NestJS implementatie van de "Facturen" module.
 * Beide APIs moeten draaien (zie TESTING_PHP_* / TESTING_NESTJS_* in .env).
 *
 * Draai enkel deze module: npm run test:e2e -- test/modules/facturen
 * Draai alle modules: npm run test:e2e
 */

import {compareModule} from "../testing-utils/ModuleComparison";

// Facturen heeft geen DATUM veld (geen BEGIN_DATUM/EIND_DATUM in PHP), dus geen getObjectsParams nodig.
// module-specifieke GetObjects opties, zie route.Facturen.php / class.Facturen.inc.php
compareModule({
    className: "Facturen",
    extraGetObjectsOptions: [
        {name: "JAAR", params: {JAAR: 2025}},
        {name: "LID_ID", params: {LID_ID: "11001"}},
        {name: "SELECTIE", params: {SELECTIE: "a"}},
    ],
});
