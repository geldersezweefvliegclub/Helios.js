/**
 * Vergelijkt de PHP en NestJS implementatie van de "Tracks" module.
 * Beide APIs moeten draaien (zie TESTING_PHP_* / TESTING_NESTJS_* in .env).
 *
 * Draai enkel deze module: npm run test:e2e -- test/modules/tracks
 * Draai alle modules: npm run test:e2e
 */

import {compareModule} from "../testing-utils/ModuleComparison";

// LINK_ID is in de NestJS implementatie bewust anders (of niet meer aanwezig) t.o.v. PHP. Geaccepteerd verschil, geen bug.
function verwijderLinkId(record: Record<string, unknown>): void {
    delete record.LINK_ID;
}

// Tracks heeft geen DATUM veld. Module-specifieke GetObjects opties, zie route.Tracks.php / class.Tracks.inc.php
// (LID_ID en INSTRUCTEUR_ID zijn de enige ondersteunde filters naast de generieke ID/VERWIJDERD/SORT/MAX/START).
compareModule({
    className: "Tracks",
    extraGetObjectsOptions: [
        {name: "LID_ID", params: {LID_ID: 10480}},
        {name: "INSTRUCTEUR_ID", params: {INSTRUCTEUR_ID: 10309}},
    ],
    transform: (nestjsCompare, phpCompare) => {
        for (const compare of [nestjsCompare, phpCompare]) {
            const dataset = compare.dataset;
            if (Array.isArray(dataset)) {
                dataset.forEach(record => verwijderLinkId(record as Record<string, unknown>));
            } else {
                verwijderLinkId(compare);
            }
        }
    },
    crud: {
        createPayload: {LID_ID: 10480, TEKST: "E2E test track"},
        updatePayload: {TEKST: "E2E test track (updated)"},
    },
});