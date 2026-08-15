/**
 * Vergelijkt de PHP en NestJS implementatie van de "Documenten" module.
 * Beide APIs moeten draaien (zie TESTING_PHP_* / TESTING_NESTJS_* in .env).
 *
 * Draai enkel deze module: npm run test:e2e -- test/modules/documenten
 * Draai alle modules: npm run test:e2e
 */

import {compareModule} from "../testing-utils/ModuleComparison";

// Documenten heeft geen DATUM veld. module-specifieke GetObjects opties, zie route.Documenten.php / class.Documenten.inc.php
compareModule({
    className: "Documenten",
    extraGetObjectsOptions: [
        {name: "LID_ID", params: {LID_ID: 10267}},
        {name: "GROEPEN", params: {GROEPEN: "22"}},
    ],
});
