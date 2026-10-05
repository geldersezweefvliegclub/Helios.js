/**
 * Vergelijkt de PHP en NestJS implementatie van de "Diensten" module.
 * Beide APIs moeten draaien (zie TESTING_PHP_* / TESTING_NESTJS_* in .env).
 *
 * Draai enkel deze module: npm run test:e2e -- test/modules/diensten
 * Draai alle modules: npm run test:e2e
 */

import {compareModule} from "../testing-utils/ModuleComparison";

// PHP kent geen fysiek verwijderen: elke testrun laat in PHP een permanent soft-deleted testrecord achter. PHP
// heeft een unieke constraint op (DATUM, LID_ID, TYPE_DIENST_ID), dus een vaste DATUM zou vanaf de tweede run
// al botsen met het (soft-deleted) record van de vorige run. Een willekeurige datum ver in de toekomst voorkomt dat.
const crudTestDatum = new Date(Date.now() + (365 * 50 + Math.floor(Math.random() * 3650)) * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10);

// BEGIN/EIND_DATUM expliciet meegeven zodat GetObjects geen impliciete default (huidig jaar) gebruikt,
// die tussen PHP en NestJS kan verschillen.
// Let op: de PHP implementatie geeft een 500 terug op GetObjects met SORT=ID (asc/desc) voor deze module
// (zie class.Diensten.inc.php). De generieke "GetObjects (SORT asc/desc)" testen worden daarom niet met PHP
// vergeleken — dit is een beperking van de legacy PHP API, geen bug. Geaccepteerde uitzondering.
compareModule({
    className: "Diensten",
    getObjectsParams: {
        BEGIN_DATUM: "2020-01-01",
        EIND_DATUM: "2026-12-31",
    },
    // module-specifieke GetObjects opties, zie route.Diensten.php / class.Diensten.inc.php
    extraGetObjectsOptions: [
        {name: "LID_ID", params: {LID_ID: 10624}},
        {name: "AANWEZIG", params: {AANWEZIG: true}},
        {name: "AFWEZIG", params: {AFWEZIG: true}},
    ],
    knownPhpFailures: ["GetObjects (SORT asc)", "GetObjects (SORT desc)"],
    transform: (nestjsCompare, _phpCompare, endpoint) => {
        // NestJS verrijkt de AddObject/UpdateObject-response met de TYPE_DIENST-omschrijving (via een include),
        // PHP's SaveObject-response bevat enkel TYPE_DIENST_ID zonder die afgeleide tekst (bij GetObjects doen
        // beide dit wel, daar blijft het veld dus gewoon vergeleken). Geaccepteerde uitzondering.
        if (endpoint.name === 'AddObject' || endpoint.name === 'UpdateObject') {
            delete nestjsCompare.TYPE_DIENST;
        }
    },
    crud: {
        // TYPE_DIENST_ID is optioneel in NestJS' schema, maar PHP eist het toch bij het aanmaken ("TYPE_DIENST_ID
        // is verplicht").
        createPayload: {DATUM: crudTestDatum, ROOSTER_ID: 7, LID_ID: 10284, TYPE_DIENST_ID: 1804},
        // AANWEZIG/AFWEZIG vermijden bij UpdateObject: PHP genereert dan een UPDATE die AFWEZIG altijd als lege
        // string meestuurt ("Incorrect integer value: '' for column AFWEZIG"), een bug in de legacy PHP-query,
        // los van wat NestJS doet. TYPE_DIENST_ID wijzigen raakt dat pad niet.
        updatePayload: {TYPE_DIENST_ID: 1807},
    },
});
