/**
 * Vergelijkt de PHP en NestJS implementatie van de "AanwezigLeden" module.
 * Beide APIs moeten draaien (zie TESTING_PHP_* / TESTING_NESTJS_* in .env).
 *
 * Draai enkel deze module: npm run test:e2e -- test/modules/aanwezig-leden
 * Draai alle modules: npm run test:e2e
 */

import {compareModule} from "../testing-utils/ModuleComparison";

// BEGIN/EIND_DATUM expliciet meegeven zodat GetObjects geen impliciete default (huidig jaar/vandaag) gebruikt,
// die tussen PHP en NestJS kan verschillen.
compareModule({
    className: "AanwezigLeden",
    getObjectsParams: {
        BEGIN_DATUM: "2026-01-01",
        EIND_DATUM: "2026-12-31",
    },
    // module-specifieke GetObjects opties, zie route.AanwezigLeden.php
    extraGetObjectsOptions: [
        {name: "ID", params: (id) => ({ID: id})},
        {name: "IN", params: (id) => ({IN: String(id)})},
        {name: "SELECTIE", params: {SELECTIE: "a"}},
        {name: "TYPES", params: {TYPES: "601"}},
        {name: "NIET_VERTROKKEN", params: {NIET_VERTROKKEN: true}},
        {name: "VLIEGVELD", params: {VLIEGVELD: 901}},
    ],
});
