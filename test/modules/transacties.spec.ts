/**
 * Vergelijkt de PHP en NestJS implementatie van de "Transacties" module.
 * Beide APIs moeten draaien (zie TESTING_PHP_* / TESTING_NESTJS_* in .env).
 *
 * Draai enkel deze module: npm run test:e2e -- test/modules/transacties
 * Draai alle modules: npm run test:e2e
 */

import {compareModule} from "../testing-utils/ModuleComparison";

// BEGIN/EIND_DATUM expliciet meegeven zodat GetObjects geen impliciete default (huidig jaar) gebruikt,
// die tussen PHP en NestJS kan verschillen.
// Let op: de PHP implementatie geeft een 405 terug op GetObjects met VERWIJDERD=true voor deze module
// (zie class.Transacties.inc.php). De generieke "GetObjects (VERWIJDERD)" test wordt daarom niet met PHP
// vergeleken — dit is een beperking van de legacy PHP API, geen bug. Geaccepteerde uitzondering.
compareModule({
    className: "Transacties",
    getObjectsParams: {
        BEGIN_DATUM: "2020-01-01",
        EIND_DATUM: "2026-12-31",
    },
    // module-specifieke GetObjects opties, zie route.Transacties.php / class.Transacties.inc.php
    extraGetObjectsOptions: [
        {name: "LID_ID", params: {LID_ID: 20958}},
        // onderstaande opties bestaan in PHP maar (nog) niet in de NestJS request DTO
        {name: "EXT_REF", params: {EXT_REF: "190538178"}},
        {name: "VLIEGDAG", params: {VLIEGDAG: "2023-04-03"}},
    ],
    knownPhpFailures: ["GetObjects (VERWIJDERD)"],
});
