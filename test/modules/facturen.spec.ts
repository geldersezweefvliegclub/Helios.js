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
// Let op: de PHP implementatie geeft een 500 terug op GetObjects met VERWIJDERD=true voor deze module
// (zie class.Facturen.inc.php). De generieke "GetObjects (VERWIJDERD)" test wordt daarom niet met PHP
// vergeleken — dit is een beperking van de legacy PHP API, geen bug. Geaccepteerde uitzondering.
compareModule({
    className: "Facturen",
    extraGetObjectsOptions: [
        {name: "JAAR", params: {JAAR: 2025}},
        {name: "LID_ID", params: {LID_ID: "11001"}},
        {name: "SELECTIE", params: {SELECTIE: "a"}},
    ],
    // PHP's Facturen class heeft geen RestoreObject-implementatie ("Call to undefined method
    // Facturen::HerstelObject()", route.Facturen.php:182, een 500). Wordt overgeslagen net als een GetObjects-optie.
    knownPhpFailures: ["GetObjects (VERWIJDERD)", "RestoreObject"],
    crud: {
        // LID_ID is optioneel/nullable, maar PHP eist het toch bij het aanmaken ("LID_ID is verplicht").
        createPayload: {JAAR: 2099, LID_ID: 10395, OMSCHRIJVING: "E2E test", GEFACTUREERD: "12"},
        updatePayload: {OMSCHRIJVING: "E2E test (updated)"},
    },
});
