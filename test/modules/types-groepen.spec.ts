/**
 * Vergelijkt de PHP en NestJS implementatie van de "TypesGroepen" module.
 * Beide APIs moeten draaien (zie TESTING_PHP_* / TESTING_NESTJS_* in .env).
 *
 * Draai enkel deze module: npm run test:e2e -- test/modules/types-groepen
 * Draai alle modules: npm run test:e2e
 */

import {compareModule} from "../testing-utils/ModuleComparison";

// TypesGroepen heeft geen DATUM veld en geen module-specifieke GetObjects opties,
// enkel de generieke ID/IDs/VERWIJDERD/SORT/MAX/START varianten uit GetObjectsRequest.
compareModule({
    className: "TypesGroepen",
});
