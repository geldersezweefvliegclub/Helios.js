/**
 * Vergelijkt de PHP en NestJS implementatie van de "Tracks" module.
 * Beide APIs moeten draaien (zie TESTING_PHP_* / TESTING_NESTJS_* in .env).
 *
 * Draai enkel deze module: npm run test:e2e -- test/modules/tracks
 * Draai alle modules: npm run test:e2e
 */

import {compareModule} from "../testing-utils/ModuleComparison";

// Tracks heeft geen DATUM veld. Module-specifieke GetObjects opties, zie route.Tracks.php / class.Tracks.inc.php
// (LID_ID en INSTRUCTEUR_ID zijn de enige ondersteunde filters naast de generieke ID/VERWIJDERD/SORT/MAX/START).
compareModule({
    className: "Tracks",
    extraGetObjectsOptions: [
        {name: "LID_ID", params: {LID_ID: 10480}},
        {name: "INSTRUCTEUR_ID", params: {INSTRUCTEUR_ID: 10309}},
    ],
});