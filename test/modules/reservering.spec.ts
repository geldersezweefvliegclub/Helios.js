/**
 * Vergelijkt de PHP en NestJS implementatie van de "Reservering" module.
 * Beide APIs moeten draaien (zie TESTING_PHP_* / TESTING_NESTJS_* in .env).
 *
 * Draai enkel deze module: npm run test:e2e -- test/modules/reservering
 * Draai alle modules: npm run test:e2e
 */

import {compareModule} from "../testing-utils/ModuleComparison";

// BEGIN/EIND_DATUM expliciet meegeven zodat GetObjects geen impliciete default (huidig jaar) gebruikt,
// die tussen PHP en NestJS kan verschillen.
// Let op: de PHP implementatie ondersteunt geen VERWIJDERD parameter op deze module (zie class.Reservering.inc.php
// GetObjects(), geen "VERWIJDERD" case in de switch) en geeft daar een 405 op terug. De generieke
// "GetObjects (VERWIJDERD)" test wordt daarom niet met PHP vergeleken — dit is een beperking van de legacy PHP API,
// geen bug. Geaccepteerde uitzondering.
compareModule({
    className: "Reservering",
    getObjectsParams: {
        BEGIN_DATUM: "2020-01-01",
        EIND_DATUM: "2026-12-31",
    },
    // module-specifieke GetObjects opties, zie route.Reservering.php / class.Reservering.inc.php
    extraGetObjectsOptions: [
        {name: "LID_ID", params: {LID_ID: 10395}},
        {name: "VLIEGTUIG_ID", params: {VLIEGTUIG_ID: 223}},
    ],
    // De legacy PHP route voor deze module ondersteunt enkel POST SaveObject (AddObject) en DELETE DeleteObject —
    // PUT SaveObject (UpdateObject) geeft een 405 "Method not allowed" terug (Allow: POST) en PATCH RestoreObject
    // bestaat helemaal niet (404). Beide stappen worden daarom overgeslagen, net als een GetObjects-optie.
    knownPhpFailures: ["GetObjects (VERWIJDERD)", "UpdateObject", "RestoreObject"],
    crud: {
        // datum ver in de toekomst zodat deze niet botst met bestaande reserveringen
        createPayload: {DATUM: "2099-06-15", VLIEGTUIG_ID: 223, LID_ID: 10395},
        updatePayload: {OPMERKINGEN: "E2E test (updated)"},
    },
});