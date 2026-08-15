/**
 * Vergelijkt de PHP en NestJS implementatie van de "Leden" module.
 * Beide APIs moeten draaien (zie TESTING_PHP_* / TESTING_NESTJS_* in .env).
 *
 * Draai enkel deze module: npm run test:e2e -- test/modules/leden
 * Draai alle modules: npm run test:e2e
 */

import {compareModule} from "../testing-utils/ModuleComparison";

// Leden heeft geen DATUM veld. module-specifieke GetObjects opties, zie route.Leden.php / class.Leden.inc.php
compareModule({
    className: "Leden",
    extraGetObjectsOptions: [
        {name: "SELECTIE", params: {SELECTIE: "a"}},
        {name: "TYPES", params: {TYPES: "601"}},
        {name: "CLUBLEDEN", params: {CLUBLEDEN: true}},
        {name: "INSTRUCTEURS", params: {INSTRUCTEURS: true}},
        {name: "DDWV_CREW", params: {DDWV_CREW: true}},
        {name: "BEHEERDERS", params: {BEHEERDERS: true}},
        {name: "LIERISTEN", params: {LIERISTEN: true}},
        {name: "LIO", params: {LIO: true}},
        {name: "STARTLEIDERS", params: {STARTLEIDERS: true}},
    ],
    transform: (nestjsCompare) => {
        // BRANDSTOF_PAS bestaat enkel in deze applicatie, niet in de PHP database. Geaccepteerde uitzondering.
        const dataset = nestjsCompare.dataset;
        if (Array.isArray(dataset)) {
            dataset.forEach(record => delete (record as Record<string, unknown>).BRANDSTOF_PAS);
        } else {
            delete nestjsCompare.BRANDSTOF_PAS;
        }
    },
});
