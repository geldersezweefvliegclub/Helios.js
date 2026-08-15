/**
 * Generic PHP vs NestJS response comparison, reused per Helios module.
 * Compares only the structure of the responses (which fields exist, object/array/scalar/null),
 * not the actual data values, since the two APIs run against live/changing data.
 * Both APIs must be running for this test to work (see TESTING_PHP_* / TESTING_NESTJS_* in .env).
 */

import {AxiosBasicCredentials} from "axios";
import {Logger} from "@nestjs/common";
import {config} from "dotenv";
import {Endpoint, RequestBuilder} from "./TestingClasses";

config();

const logger = new Logger('Module Comparison (e2e)');

function GetPhpAuth(): AxiosBasicCredentials | null {
    if (!process.env.TESTING_PHP_USERNAME || !process.env.TESTING_PHP_PASSWORD) {
        return null;
    }

    return {
        username: process.env.TESTING_PHP_USERNAME,
        password: process.env.TESTING_PHP_PASSWORD
    };
}

function GetNestjsAuth(): AxiosBasicCredentials | null {
    if (!process.env.TESTING_NESTJS_USERNAME || !process.env.TESTING_NESTJS_PASSWORD) {
        return null;
    }

    return {
        username: process.env.TESTING_NESTJS_USERNAME,
        password: process.env.TESTING_NESTJS_PASSWORD
    };
}

// removes fields that are expected to differ between the two APIs (hashes, timestamps, ...)
function normalize(data: Record<string, unknown>): Record<string, unknown> {
    const rest: Record<string, unknown> = {...data};
    delete rest.hash;
    delete rest.HASH;
    delete rest.LAATSTE_AANPASSING;
    delete rest.laatste_aanpassing;

    const dataset = rest.dataset;
    delete rest.dataset;

    if (!Array.isArray(dataset)) {
        return rest;
    }

    return {
        ...rest,
        dataset: dataset.map((record: Record<string, unknown>) => {
            const recordRest = {...record};
            delete recordRest.LAATSTE_AANPASSING;
            return recordRest;
        })
    };
}

// beschrijft enkel de vorm van data (welke velden bestaan, object/array/scalar/null), niet de waarden zelf
type Shape =
    | { kind: 'scalar' }
    | { kind: 'null' }
    | { kind: 'missing' }
    | { kind: 'array', items: Shape }
    | { kind: 'object', keys: Record<string, Shape> };

function shapeOf(value: unknown): Shape {
    if (Array.isArray(value)) {
        return {kind: 'array', items: value.map(shapeOf).reduce(mergeShape, {kind: 'null'})};
    }
    if (value === null || value === undefined) {
        return {kind: 'null'};
    }
    if (typeof value === 'object') {
        const keys: Record<string, Shape> = {};
        for (const key of Object.keys(value as Record<string, unknown>).sort()) {
            keys[key] = shapeOf((value as Record<string, unknown>)[key]);
        }
        return {kind: 'object', keys};
    }
    return {kind: 'scalar'};
}

// combineert de vorm van alle records in een dataset, zodat een veld dat slechts in een deel van de records voorkomt
// (bv. optioneel/nullable) toch als aanwezig telt, in plaats van een vals verschil te geven tussen korte en lange datasets
function mergeShape(a: Shape, b: Shape): Shape {
    if (a.kind === 'null') return b;
    if (b.kind === 'null') return a;
    if (a.kind === 'array' && b.kind === 'array') {
        return {kind: 'array', items: mergeShape(a.items, b.items)};
    }
    if (a.kind === 'object' && b.kind === 'object') {
        const keys: Record<string, Shape> = {};
        for (const key of new Set([...Object.keys(a.keys), ...Object.keys(b.keys)])) {
            keys[key] = mergeShape(a.keys[key] ?? {kind: 'null'}, b.keys[key] ?? {kind: 'null'});
        }
        return {kind: 'object', keys};
    }
    return a;
}

// maakt twee vormen onderling vergelijkbaar met toEqual: een veld dat bij één API "null" is (leeg/nullable)
// wordt gelijkgetrokken aan de andere kant, maar een veld dat bij één API volledig ontbreekt blijft zichtbaar
// als "missing" in het diff, want dat is wél een structureel verschil.
function reconcile(a: Shape, b: Shape): [Shape, Shape] {
    if (a.kind === 'array' && b.kind === 'array') {
        const [items1, items2] = reconcile(a.items, b.items);
        return [{kind: 'array', items: items1}, {kind: 'array', items: items2}];
    }
    if (a.kind === 'object' && b.kind === 'object') {
        const keys1: Record<string, Shape> = {};
        const keys2: Record<string, Shape> = {};
        for (const key of new Set([...Object.keys(a.keys), ...Object.keys(b.keys)])) {
            const inA = key in a.keys;
            const inB = key in b.keys;

            if (inA && inB) {
                const [shape1, shape2] = reconcile(a.keys[key], b.keys[key]);
                keys1[key] = shape1;
                keys2[key] = shape2;
            } else if (inA) {
                keys1[key] = a.keys[key];
                keys2[key] = {kind: 'missing'};
            } else {
                keys1[key] = {kind: 'missing'};
                keys2[key] = b.keys[key];
            }
        }
        return [{kind: 'object', keys: keys1}, {kind: 'object', keys: keys2}];
    }
    if (a.kind === 'null' || b.kind === 'null') {
        const unified = a.kind === 'null' ? b : a;
        return [unified, unified];
    }
    return [a, b];
}

// een GetObjects optie die enkel getest kan worden met een bestaand database ID (bv. IN=<LID_ID>)
type IdDependentParams = (id: number) => Record<string, unknown>;

export interface GetObjectsOption {
    // naam van de optie, bv. "SELECTIE" of "TYPES", gebruikt in de test naam
    name: string;

    // query parameters voor deze variant. Gebruik een functie als de optie een bestaand database ID nodig heeft
    params: Record<string, unknown> | IdDependentParams;
}

export interface ModuleComparisonConfig {
    // naam van de Helios class, gebruikt als route prefix, bv. "AanwezigLeden"
    className: string;

    // query parameters die bij elke GetObjects aanroep worden meegestuurd, bv. een datumbereik
    getObjectsParams?: Record<string, unknown>;

    // module-specifieke GetObjects opties (naast de generieke MAX/START/SORT/VERWIJDERD/ID varianten die voor elke module gelden),
    // bv. SELECTIE, IN, TYPES voor AanwezigLeden. GetObjects bestaat in elke module, maar de extra opties verschillen per module.
    extraGetObjectsOptions?: GetObjectsOption[];

    // module-specifieke aanpassingen op de responses vóór de vergelijking (velden hernoemen/verwijderen)
    transform?: (nestjsCompare: Record<string, unknown>, phpCompare: Record<string, unknown>, endpoint: Endpoint) => void;
}

export function compareModule(testConfig: ModuleComparisonConfig): void {
    const {className, getObjectsParams = {}, extraGetObjectsOptions = [], transform} = testConfig;

    const NESTJS_API_URL = process.env.TESTING_NESTJS_URL;
    const PHP_API_URL = process.env.TESTING_PHP_URL;

    describe(className, () => {
        let requestBuilder: RequestBuilder;

        // eenmalig via GetObjects opgehaald, daarna herbruikt door elke test die een bestaand database ID nodig heeft
        // (GetObjects ID/IDs varianten, module-specifieke opties zoals IN, en de GetObject test) in plaats van het
        // telkens opnieuw op te vragen of voor elk record uit GetObjects te herhalen.
        let discoveredId: number | undefined;

        beforeEach(() => {
            requestBuilder = new RequestBuilder();
        });

        beforeAll(async () => {
            const builder = new RequestBuilder();
            const discoverEndpoint = new Endpoint("GetObjects (discover ID)", "GET", `/${className}/GetObjects`, {...getObjectsParams, MAX: 1, SORT: 'ID'});
            const discoverResponse = await builder.makeRequest(NESTJS_API_URL, discoverEndpoint, GetNestjsAuth());
            const dataset = discoverResponse.data?.dataset as { ID?: number }[] | undefined;
            discoveredId = dataset?.[0]?.ID;

            if (!discoveredId) {
                logger.warn(`Geen record gevonden voor "${className}", tests die een bestaand ID nodig hebben worden overgeslagen`);
            }
        }, 40000);

        async function compareEndpoint(endpoint: Endpoint): Promise<void> {
            const nestjsResponse = await requestBuilder.makeRequest(NESTJS_API_URL, endpoint, GetNestjsAuth());
            const phpResponse = await requestBuilder.makeRequest(PHP_API_URL, endpoint, GetPhpAuth());

            const nestjsCompare = normalize(nestjsResponse.data);
            const phpCompare = normalize(phpResponse.data);

            transform?.(nestjsCompare, phpCompare, endpoint);

            const [nestjsShape, phpShape] = reconcile(shapeOf(nestjsCompare), shapeOf(phpCompare));

            expect(nestjsResponse.status).toEqual(phpResponse.status);
            expect(nestjsShape).toEqual(phpShape);
        }

        // varianten die geen bestaand database ID nodig hebben, en dus voor elke module hetzelfde zijn
        const genericGetObjectsEndpoints = [
            new Endpoint("GetObjects", "GET", `/${className}/GetObjects`, {...getObjectsParams}),
            new Endpoint("GetObjects (MAX)", "GET", `/${className}/GetObjects`, {...getObjectsParams, MAX: 2}),
            new Endpoint("GetObjects (START+MAX)", "GET", `/${className}/GetObjects`, {...getObjectsParams, START: 4, MAX: 2}),
            new Endpoint("GetObjects (SORT asc)", "GET", `/${className}/GetObjects`, {...getObjectsParams, SORT: 'ID'}),
            new Endpoint("GetObjects (SORT desc)", "GET", `/${className}/GetObjects`, {...getObjectsParams, SORT: 'ID DESC'}),
            new Endpoint("GetObjects (VERWIJDERD)", "GET", `/${className}/GetObjects`, {...getObjectsParams, VERWIJDERD: true}),
        ];

        for (const endpoint of genericGetObjectsEndpoints) {
            it(`${endpoint.name} - Compare PHP API and NestJS API response`, () => compareEndpoint(endpoint), 40000);
        }

        // module-specifieke GetObjects opties, elk optioneel afhankelijk van het eenmalig opgehaalde database ID
        for (const option of extraGetObjectsOptions) {
            it(`GetObjects (${option.name}) - Compare PHP API and NestJS API response`, async () => {
                if (typeof option.params === 'function') {
                    if (!discoveredId) {
                        logger.warn(`"${option.name}" heeft een bestaand ID nodig, maar er is geen record gevonden voor "${className}", test wordt overgeslagen`);
                        return;
                    }

                    await compareEndpoint(new Endpoint(`GetObjects (${option.name})`, "GET", `/${className}/GetObjects`, {...getObjectsParams, ...option.params(discoveredId)}));
                    return;
                }

                await compareEndpoint(new Endpoint(`GetObjects (${option.name})`, "GET", `/${className}/GetObjects`, {...getObjectsParams, ...option.params}));
            }, 40000);
        }

        // GetObject wordt precies één keer vergeleken, met het hierboven eenmalig opgehaalde ID (niet voor elk record uit GetObjects)
        it('GetObject - Compare PHP API and NestJS API response', async () => {
            if (!discoveredId) {
                logger.warn(`Geen record gevonden om GetObject voor "${className}" te testen, test wordt overgeslagen`);
                return;
            }

            await compareEndpoint(new Endpoint("GetObject", "GET", `/${className}/GetObject`, {ID: discoveredId}));
        }, 40000);
    });
}
