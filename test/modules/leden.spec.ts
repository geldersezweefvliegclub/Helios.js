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
        // BRANDSTOF_PAS en ROLLEN_ID bestaan enkel in deze applicatie, niet in de PHP database. Geaccepteerde uitzondering.
        //
        // DIENSTEN/GMAIL: de PHP GetObjects-lijst laat deze velden volledig weg wanneer ze null zijn, terwijl
        // NestJS ze altijd meestuurt (met waarde null). Bij GetObject (enkel record) doen beide dit niet, dus
        // daar blijven ze wel vergeleken. Geaccepteerde uitzondering.
        const dataset = nestjsCompare.dataset;
        if (Array.isArray(dataset)) {
            dataset.forEach(record => {
                const rec = record as Record<string, unknown>;
                delete rec.BRANDSTOF_PAS;
                delete rec.ROLLEN_ID;
                delete rec.DIENSTEN;
                delete rec.GMAIL;
            });
        } else {
            delete nestjsCompare.BRANDSTOF_PAS;
            delete nestjsCompare.ROLLEN_ID;
        }
    },
    crud: {
        createPayload: {VOORNAAM: "E2E", ACHTERNAAM: "Testlid", LIDTYPE_ID: 602},
        updatePayload: {WOONPLAATS: "Teststad"},
    },
});
