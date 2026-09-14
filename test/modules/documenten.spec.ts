/**
 * Vergelijkt de PHP en NestJS implementatie van de "Documenten" module.
 * Beide APIs moeten draaien (zie TESTING_PHP_* / TESTING_NESTJS_* in .env).
 *
 * Draai enkel deze module: npm run test:e2e -- test/modules/documenten
 * Draai alle modules: npm run test:e2e
 */

import {compareModule} from "../testing-utils/ModuleComparison";

// Documenten heeft geen DATUM veld. module-specifieke GetObjects opties, zie route.Documenten.php / class.Documenten.inc.php
// Let op: de PHP implementatie geeft een 500 terug op GetObjects met GROEPEN="22" voor deze module
// (zie class.Documenten.inc.php). Die test wordt daarom niet met PHP vergeleken — dit is een beperking
// van de legacy PHP API, geen bug. Geaccepteerde uitzondering.
compareModule({
    className: "Documenten",
    extraGetObjectsOptions: [
        {name: "LID_ID", params: {LID_ID: 10267}},
        {name: "GROEPEN", params: {GROEPEN: "22"}},
    ],
    knownPhpFailures: ["GetObjects (GROEPEN)"],
    crud: {
        createPayload: {GROEP_ID: 4148, TEKST: "E2E test document", VOLGORDE: 99},
        updatePayload: {TEKST: "E2E test document (updated)"},
    },
});
