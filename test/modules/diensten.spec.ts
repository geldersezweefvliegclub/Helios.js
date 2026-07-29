/**
 * Vergelijkt de PHP en NestJS implementatie van de "Diensten" module.
 * Beide APIs moeten draaien (zie TESTING_PHP_* / TESTING_NESTJS_* in .env).
 *
 * Draai enkel deze module: npm run test:e2e -- test/modules/diensten
 * Draai alle modules: npm run test:e2e
 */

import {compareModule} from "../testing-utils/ModuleComparison";

// BEGIN/EIND_DATUM expliciet meegeven zodat GetObjects geen impliciete default (huidig jaar) gebruikt,
// die tussen PHP en NestJS kan verschillen.
compareModule({
    className: "Diensten",
    getObjectsParams: {
        BEGIN_DATUM: "2020-01-01",
        EIND_DATUM: "2026-12-31",
    },
    // module-specifieke GetObjects opties, zie route.Diensten.php / class.Diensten.inc.php
    extraGetObjectsOptions: [
        {name: "LID_ID", params: {LID_ID: 10624}},
        {name: "AANWEZIG", params: {AANWEZIG: true}},
        {name: "AFWEZIG", params: {AFWEZIG: true}},
    ],
});
