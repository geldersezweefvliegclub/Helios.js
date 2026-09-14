/**
 * Vergelijkt de PHP en NestJS implementatie van de "Competenties" module.
 * Beide APIs moeten draaien (zie TESTING_PHP_* / TESTING_NESTJS_* in .env).
 *
 * Draai enkel deze module: npm run test:e2e -- test/modules/competenties
 * Draai alle modules: npm run test:e2e
 */

import {compareModule} from "../testing-utils/ModuleComparison";

// PHP gebruikt nog de oorspronkelijke kolomnamen BLOK_ID/ONDERWERP, terwijl NestJS deze bewust hernoemd heeft
// naar OUDER_ID/OMSCHRIJVING (zie SQL/migratie-script.sql). Dit is een geaccepteerd verschil, geen bug.
function hernoemBlokIdEnOnderwerp(record: Record<string, unknown>): void {
    if ('BLOK_ID' in record) {
        record.OUDER_ID = record.BLOK_ID;
        delete record.BLOK_ID;
    }
    if ('ONDERWERP' in record) {
        record.OMSCHRIJVING = record.ONDERWERP;
        delete record.ONDERWERP;
    }
}

// Competenties heeft geen DATUM veld. LEERFASE_ID is de enige module-specifieke GetObjects optie, zie route.Competenties.php
compareModule({
    className: "Competenties",
    extraGetObjectsOptions: [
        {name: "LEERFASE_ID", params: {LEERFASE_ID: 1000}},
    ],
    transform: (nestjsCompare, phpCompare) => {
        const dataset = phpCompare.dataset;
        if (Array.isArray(dataset)) {
            dataset.forEach(record => hernoemBlokIdEnOnderwerp(record as Record<string, unknown>));
        } else {
            hernoemBlokIdEnOnderwerp(phpCompare);
        }
    },
    // PHP verwacht bij het aanmaken/bijwerken nog de oorspronkelijke veldnamen ONDERWERP/BLOK_ID, terwijl NestJS
    // de nieuwe namen OMSCHRIJVING/OUDER_ID verwacht (zie de veldhernoeming hierboven). Geaccepteerd verschil.
    crud: {
        createPayload: {LEERFASE_ID: 1000, OMSCHRIJVING: "E2E test competentie"},
        updatePayload: {OMSCHRIJVING: "E2E test competentie (updated)"},
        phpCreatePayload: {LEERFASE_ID: 1000, ONDERWERP: "E2E test competentie"},
        phpUpdatePayload: {ONDERWERP: "E2E test competentie (updated)"},
    },
});
