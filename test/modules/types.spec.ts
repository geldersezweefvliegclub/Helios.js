/**
 * Vergelijkt de PHP en NestJS implementatie van de "Types" module.
 * Beide APIs moeten draaien (zie TESTING_PHP_* / TESTING_NESTJS_* in .env).
 *
 * Draai enkel deze module: npm run test:e2e -- test/modules/types
 * Draai alle modules: npm run test:e2e
 */

import {compareModule} from "../testing-utils/ModuleComparison";

// Types heeft geen DATUM veld. GROEP is de enige module-specifieke GetObjects optie, zie route.Types.php
compareModule({
    className: "Types",
    extraGetObjectsOptions: [
        {name: "GROEP", params: {GROEP: 4}},
    ],
});
