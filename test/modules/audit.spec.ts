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
//
// Let op:
// - PHP geeft een 405 terug op GetObjects met VERWIJDERD=true en een 500 op GetObjects met SELECTIE
//   (zie class.Audit.inc.php). Die testen worden daarom niet met PHP vergeleken.
// - De PHP audit-tabel en de NestJS audit-tabel zijn twee gescheiden, niet-gesynchroniseerde logs, dus
//   een ID dat in de ene bestaat hoeft niet in de andere te bestaan. GetObject wordt daarom niet met PHP
//   vergeleken.
// - PHP's audit-historie bevat kolommen (BEHEERDER, DDWV, LIDTYPE, LIDTYPE_ID, STARTTOREN) die niet meer
//   bestaan in het NestJS schema. Deze worden voor de vergelijking uit de PHP-response verwijderd.
// Geaccepteerde uitzonderingen.
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
    knownPhpFailures: ["GetObjects (VERWIJDERD)", "GetObjects (SELECTIE)", "GetObject"],
    transform: (_nestjsCompare, phpCompare) => {
        const fieldsToDrop = ["BEHEERDER", "DDWV", "LIDTYPE", "LIDTYPE_ID", "STARTTOREN"];
        const dataset = phpCompare.dataset;
        if (Array.isArray(dataset)) {
            phpCompare.dataset = dataset.map(record => {
                const rest = {...(record as Record<string, unknown>)};
                for (const field of fieldsToDrop) delete rest[field];
                return rest;
            });
        } else {
            for (const field of fieldsToDrop) delete phpCompare[field];
        }
    },
});
