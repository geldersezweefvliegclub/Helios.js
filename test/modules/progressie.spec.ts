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
    crud: {
        createPayload: {LID_ID: 10118, COMPETENTIE_ID: 35, INSTRUCTEUR_ID: 100},
        // NestJS staat sinds kort maar 1 actief progressie record per lid+competentie toe. PHP kent die
        // beperking niet, en de test maakt bewust een los NestJS- en PHP-record aan om te vergelijken - een
        // andere COMPETENTIE_ID voor PHP voorkomt dat die twee gelijktijdige records botsen op die regel
        phpCreatePayload: {LID_ID: 10118, COMPETENTIE_ID: 36, INSTRUCTEUR_ID: 100},
        updatePayload: {OPMERKINGEN: "E2E test (updated)"},
    },
});