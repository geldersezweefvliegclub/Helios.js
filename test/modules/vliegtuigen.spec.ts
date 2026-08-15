/**
 * Vergelijkt de PHP en NestJS implementatie van de "Vliegtuigen" module.
 * Beide APIs moeten draaien (zie TESTING_PHP_* / TESTING_NESTJS_* in .env).
 *
 * Draai enkel deze module: npm run test:e2e -- test/modules/vliegtuigen
 * Draai alle modules: npm run test:e2e
 */

import {compareModule} from "../testing-utils/ModuleComparison";

// Vliegtuigen heeft geen DATUM veld. Module-specifieke GetObjects opties, zie route.Vliegtuigen.php
compareModule({
    className: "Vliegtuigen",
    extraGetObjectsOptions: [
        {name: "IN", params: (id) => ({IN: String(id)})},
        {name: "SELECTIE", params: {SELECTIE: "PH"}},
        {name: "TYPES", params: {TYPES: "4022"}},
        {name: "ZITPLAATSEN", params: {ZITPLAATSEN: 1}},
        {name: "CLUBKIST", params: {CLUBKIST: true}},
        {name: "ZELFSTART", params: {ZELFSTART: true}},
        {name: "SLEEPKIST", params: {SLEEPKIST: true}},
        {name: "TMG", params: {TMG: true}},
    ],
});
