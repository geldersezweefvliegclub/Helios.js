/**
 * Vergelijkt de PHP en NestJS implementatie van de "Startlijst" module.
 * Beide APIs moeten draaien (zie TESTING_PHP_* / TESTING_NESTJS_* in .env).
 *
 * Draai enkel deze module: npm run test:e2e -- test/modules/startlijst
 * Draai alle modules: npm run test:e2e
 */

import {compareModule} from "../testing-utils/ModuleComparison";

// BEGIN/EIND_DATUM expliciet meegeven zodat GetObjects geen impliciete default (huidig jaar) gebruikt,
// die tussen PHP en NestJS kan verschillen.
// module-specifieke GetObjects opties, zie route.Startlijst.php / class.Startlijst.inc.php GetObjects()
compareModule({
    className: "Startlijst",
    getObjectsParams: {
        BEGIN_DATUM: "2020-01-01",
        EIND_DATUM: "2026-12-31",
    },
    extraGetObjectsOptions: [
        {name: "LID_ID", params: {LID_ID: 10083}},
        {name: "VLIEGTUIG_ID", params: {VLIEGTUIG_ID: 296}},
        {name: "STARTMETHODE_ID", params: {STARTMETHODE_ID: 550}},
        {name: "SELECTIE", params: {SELECTIE: "PH-"}},
        {name: "OPEN_STARTS", params: {OPEN_STARTS: true}},
        {name: "DDWV", params: {DDWV: true}},
    ],
});