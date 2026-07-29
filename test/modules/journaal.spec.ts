/**
 * Vergelijkt de PHP en NestJS implementatie van de "Journaal" module.
 * Beide APIs moeten draaien (zie TESTING_PHP_* / TESTING_NESTJS_* in .env).
 *
 * Draai enkel deze module: npm run test:e2e -- test/modules/journaal
 * Draai alle modules: npm run test:e2e
 */

import {compareModule} from "../testing-utils/ModuleComparison";

// BEGIN/EIND_DATUM expliciet meegeven zodat GetObjects geen impliciete default (huidig jaar) gebruikt,
// die tussen PHP en NestJS kan verschillen.
compareModule({
    className: "Journaal",
    getObjectsParams: {
        BEGIN_DATUM: "2020-01-01",
        EIND_DATUM: "2026-12-31",
    },
    // module-specifieke GetObjects opties, zie route.Journaal.php / class.Journaal.inc.php
    extraGetObjectsOptions: [
        {name: "SELECTIE", params: {SELECTIE: "a"}},
        {name: "VLIEGTUIG_ID", params: {VLIEGTUIG_ID: "295"}},
        {name: "ROLLEND_ID", params: {ROLLEND_ID: "2302"}},
        {name: "MELDER_ID", params: {MELDER_ID: 10551}},
        {name: "TECHNICUS_ID", params: {TECHNICUS_ID: 10551}},
        {name: "CATEGORIE_ID", params: {CATEGORIE_ID: "2403"}},
        {name: "STATUS_ID", params: {STATUS_ID: "2501"}},
        {name: "ROLLEND", params: {ROLLEND: true}},
        {name: "VLIEGEND", params: {VLIEGEND: true}},
    ],
});
