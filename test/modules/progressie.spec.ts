/**
 * Vergelijkt de PHP en NestJS implementatie van de "Progressie" module.
 * Beide APIs moeten draaien (zie TESTING_PHP_* / TESTING_NESTJS_* in .env).
 *
 * Draai enkel deze module: npm run test:e2e -- test/modules/progressie
 * Draai alle modules: npm run test:e2e
 */

import {compareModule} from "../testing-utils/ModuleComparison";

// Progressie heeft geen DATUM veld. Module-specifieke GetObjects opties, zie route.Progressie.php / class.Progressie.inc.php
compareModule({
    className: "Progressie",
    extraGetObjectsOptions: [
        {name: "LID_ID", params: {LID_ID: 10118}},
        {name: "INSTRUCTEUR_ID", params: {INSTRUCTEUR_ID: 100}},
        {name: "IN", params: {IN: "255,253"}},
    ],
});