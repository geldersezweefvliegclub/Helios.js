/**
 * Vergelijkt de PHP en NestJS implementatie van de "Audit" module.
 * Beide APIs moeten draaien (zie TESTING_PHP_* / TESTING_NESTJS_* in .env).
 *
 * Draai enkel deze module: npm run test:e2e -- test/modules/audit
 * Draai alle modules: npm run test:e2e
 */

import {compareModule} from "../testing-utils/ModuleComparison";

// BEGIN/EIND_DATUM expliciet meegeven zodat GetObjects geen impliciete default (huidig jaar) gebruikt,
// die tussen PHP en NestJS kan verschillen.
compareModule({
    className: "Audit",
    getObjectsParams: {
        BEGIN_DATUM: "2020-01-01",
        EIND_DATUM: "2026-12-31",
    },
    // module-specifieke GetObjects opties, zie route.Audit.php / class.Audit.inc.php
    extraGetObjectsOptions: [
        {name: "LID_ID", params: {LID_ID: 10395}},
        {name: "SELECTIE", params: {SELECTIE: "a"}},
        {name: "TABEL", params: {TABEL: "oper_transacties"}},
        {name: "BEGIN_ID", params: {BEGIN_ID: 1}},
        {name: "EIND_ID", params: {EIND_ID: 100}},
    ],
});
