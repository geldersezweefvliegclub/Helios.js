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

export interface CrudTestConfig {
    // payload voor AddObject. ID/VERWIJDERD/LAATSTE_AANPASSING hoeven niet meegegeven te worden, de server
    // negeert/overschrijft ze toch. Moet minstens de verplichte velden bevatten om een geldig record aan te maken,
    // inclusief eventuele foreign keys (bv. een bestaand LID_ID/GROEP_ID). Wordt naar NestJS gestuurd, en ook naar
    // PHP tenzij phpCreatePayload is opgegeven.
    createPayload: Record<string, unknown>;

    // payload voor UpdateObject, toegepast op het net via createPayload aangemaakte record. Wordt naar NestJS
    // gestuurd, en ook naar PHP tenzij phpUpdatePayload is opgegeven.
    updatePayload: Record<string, unknown>;

    // enkele modules gebruiken in PHP andere veldnamen dan in NestJS voor hetzelfde concept (bv. Competenties:
    // PHP verwacht ONDERWERP/BLOK_ID, NestJS OMSCHRIJVING/OUDER_ID - zie ook de `transform` optie hierboven, die
    // hetzelfde doet voor het lezen van responses). Geef hier de PHP-specifieke payload op indien nodig; standaard
    // wordt dezelfde payload als createPayload/updatePayload naar beide APIs gestuurd.
    phpCreatePayload?: Record<string, unknown>;
    phpUpdatePayload?: Record<string, unknown>;
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

    // namen van GetObjects/GetObject varianten (bv. "GetObjects (VERWIJDERD)") waarvan bekend is dat de legacy PHP
    // API zelf al een foutstatus (405/500/...) teruggeeft voor deze queryparameters, los van wat NestJS doet.
    // Deze varianten worden niet met PHP vergeleken, enkel getest of NestJS zelf een geldig antwoord (200) geeft,
    // want de referentie-API zelf faalt al vóór er iets te vergelijken valt. Geaccepteerde uitzondering.
    knownPhpFailures?: string[];

    // configuratie voor de CRUD-vergelijking (AddObject/UpdateObject/DeleteObject/RestoreObject). Als dit ontbreekt
    // worden enkel de (read-only) GetObject/GetObjects testen uitgevoerd.
    crud?: CrudTestConfig;
}

export function compareModule(testConfig: ModuleComparisonConfig): void {
    const {className, getObjectsParams = {}, extraGetObjectsOptions = [], transform, knownPhpFailures = [], crud} = testConfig;

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
            if (knownPhpFailures.includes(endpoint.name)) {
                const nestjsResponse = await requestBuilder.makeRequest(NESTJS_API_URL, endpoint, GetNestjsAuth());
                expect(nestjsResponse.status).toEqual(200);
                return;
            }

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

        if (crud) {
            // De legacy PHP "SaveObject"/"DeleteObject"/"RestoreObject" routes volgen een aantal vaste conventies
            // die stelselmatig afwijken van de NestJS implementatie (bevestigd via handmatige tests tegen de
            // draaiende servers, onafhankelijk van de module). Geaccepteerde verschillen van de legacy API:
            // - AddObject (POST SaveObject): PHP geeft status 200 terug. Sommige modules geven daarbij enkel het
            //   nieuwe ID terug (geen JSON object, bv. Documenten), andere geven net als NestJS het volledige
            //   aangemaakte record terug (bv. Leden, Progressie) - dit verschilt per module en wordt dus per geval
            //   gedetecteerd. NestJS geeft status 201 met het volledige aangemaakte record.
            // - UpdateObject (PUT SaveObject): het ID moet in de body zitten, niet als query parameter (PHP geeft
            //   anders een 406 "ID moet ingevuld zijn"). Beide geven status 200 terug (NestJS' PUT-route heeft geen
            //   expliciete @HttpCode() override, dus dat is de standaard Nest-status voor PUT, niet de CREATED uit
            //   de Swagger-documentatie) en het volledige bijgewerkte record, dus dat wordt wel op vorm vergeleken.
            // - RestoreObject (PATCH): PHP geeft status 202 Accepted terug, NestJS status 200 OK.
            // - DeleteObject (DELETE): beide geven status 204 No Content terug.
            // - RemoveObject (DELETE, fysiek verwijderen): bestaat niet in de PHP API. NestJS staat dit pas toe
            //   nadat het record al gemarkeerd is als verwijderd via DeleteObject. Wordt apart, enkel tegen
            //   NestJS, getest.
            it('AddObject / UpdateObject / DeleteObject / RestoreObject - Compare PHP API and NestJS API response', async () => {
                const addEndpoint = new Endpoint("AddObject", "POST", `/${className}/SaveObject`);

                const nestjsCreate = await requestBuilder.makeRequest(NESTJS_API_URL, addEndpoint, GetNestjsAuth(), crud.createPayload);
                const phpCreate = await requestBuilder.makeRequest(PHP_API_URL, addEndpoint, GetPhpAuth(), crud.phpCreatePayload ?? crud.createPayload);

                expect(nestjsCreate.status).toEqual(201);
                expect(phpCreate.status).toEqual(200);

                const nestjsId = (nestjsCreate.data as { ID?: number }).ID;
                expect(typeof nestjsId).toEqual('number');

                // sommige modules geven bij AddObject enkel het nieuwe ID terug (scalar), andere het volledige
                // record (object) - bepaal dit al vóór de try/finally, zodat een fout hierin de cleanup hieronder
                // niet overslaat (beide records zijn op dit punt al aangemaakt, ook al faalt een latere assertie)
                const phpId: number | undefined = typeof phpCreate.data === 'number'
                    ? phpCreate.data
                    : (phpCreate.data as { ID?: number }).ID;
                expect(typeof phpId).toEqual('number');

                try {
                    // enkel wanneer PHP het volledige record teruggeeft (niet enkel het kale ID) valt er iets op
                    // vorm te vergelijken
                    if (typeof phpCreate.data !== 'number') {
                        const nestjsCreateCompare = normalize(nestjsCreate.data);
                        const phpCreateCompare = normalize(phpCreate.data);
                        transform?.(nestjsCreateCompare, phpCreateCompare, addEndpoint);
                        const [nestjsCreateShape, phpCreateShape] = reconcile(shapeOf(nestjsCreateCompare), shapeOf(phpCreateCompare));
                        expect(nestjsCreateShape).toEqual(phpCreateShape);
                    }

                    const updateEndpoint = new Endpoint("UpdateObject", "PUT", `/${className}/SaveObject`);

                    const nestjsUpdate = await requestBuilder.makeRequest(NESTJS_API_URL, updateEndpoint, GetNestjsAuth(), {...crud.updatePayload, ID: nestjsId});
                    expect(nestjsUpdate.status).toEqual(200);

                    // sommige modules ondersteunen UpdateObject helemaal niet in de legacy PHP API (bv.
                    // Reservering: PUT SaveObject geeft een 405 "Method not allowed", enkel POST wordt ondersteund).
                    // Net als bij GetObjects/RestoreObject wordt dat via knownPhpFailures overgeslagen.
                    if (!knownPhpFailures.includes('UpdateObject')) {
                        const phpUpdate = await requestBuilder.makeRequest(PHP_API_URL, updateEndpoint, GetPhpAuth(), {...(crud.phpUpdatePayload ?? crud.updatePayload), ID: phpId});
                        expect(phpUpdate.status).toEqual(200);

                        const nestjsUpdateCompare = normalize(nestjsUpdate.data);
                        const phpUpdateCompare = normalize(phpUpdate.data);
                        transform?.(nestjsUpdateCompare, phpUpdateCompare, updateEndpoint);
                        const [nestjsUpdateShape, phpUpdateShape] = reconcile(shapeOf(nestjsUpdateCompare), shapeOf(phpUpdateCompare));
                        expect(nestjsUpdateShape).toEqual(phpUpdateShape);
                    }

                    const nestjsDelete = await requestBuilder.makeRequest(NESTJS_API_URL, new Endpoint("DeleteObject", "DELETE", `/${className}/DeleteObject`, {ID: nestjsId}), GetNestjsAuth());
                    const phpDelete = await requestBuilder.makeRequest(PHP_API_URL, new Endpoint("DeleteObject", "DELETE", `/${className}/DeleteObject`, {ID: phpId}), GetPhpAuth());
                    expect(nestjsDelete.status).toEqual(204);
                    expect(phpDelete.status).toEqual(204);

                    const nestjsRestore = await requestBuilder.makeRequest(NESTJS_API_URL, new Endpoint("RestoreObject", "PATCH", `/${className}/RestoreObject`, {ID: nestjsId}), GetNestjsAuth());
                    expect(nestjsRestore.status).toEqual(200);

                    // sommige modules hebben geen werkende RestoreObject in de legacy PHP API (bv. Facturen:
                    // "Call to undefined method Facturen::HerstelObject()", een 500). Net als bij GetObjects wordt
                    // dat via knownPhpFailures overgeslagen in plaats van vergeleken.
                    if (!knownPhpFailures.includes('RestoreObject')) {
                        const phpRestore = await requestBuilder.makeRequest(PHP_API_URL, new Endpoint("RestoreObject", "PATCH", `/${className}/RestoreObject`, {ID: phpId}), GetPhpAuth());
                        expect(phpRestore.status).toEqual(202);
                    }
                } finally {
                    // opruimen: eerst soft-delete (nodig voordat RemoveObject wordt geaccepteerd). PHP kent geen
                    // fysiek verwijderen, dus daar blijft de soft-delete als eindstaat staan. NestJS wordt nadien
                    // wél volledig verwijderd zodat er geen testdata blijft hangen. Best-effort: als de test
                    // hierboven al faalde, mag een mislukte cleanup dat niet overschrijven.
                    await requestBuilder.makeRequest(PHP_API_URL, new Endpoint("DeleteObject (cleanup)", "DELETE", `/${className}/DeleteObject`, {ID: phpId}), GetPhpAuth()).catch(() => undefined);
                    await requestBuilder.makeRequest(NESTJS_API_URL, new Endpoint("DeleteObject (cleanup)", "DELETE", `/${className}/DeleteObject`, {ID: nestjsId}), GetNestjsAuth()).catch(() => undefined);
                    await requestBuilder.makeRequest(NESTJS_API_URL, new Endpoint("RemoveObject (cleanup)", "DELETE", `/${className}/RemoveObject`, {ID: nestjsId}), GetNestjsAuth()).catch(() => undefined);
                }
            }, 40000);

            // RemoveObject (fysiek verwijderen) bestaat niet in de legacy PHP API, dus dit wordt enkel tegen NestJS
            // zelf getest: een record aanmaken, markeren als verwijderd (vereist voor RemoveObject), fysiek
            // verwijderen, en controleren dat het nadien echt weg is (404).
            it('RemoveObject (NestJS only, geen PHP-equivalent) - permanently deletes the record', async () => {
                const addEndpoint = new Endpoint("AddObject", "POST", `/${className}/SaveObject`);
                const nestjsCreate = await requestBuilder.makeRequest(NESTJS_API_URL, addEndpoint, GetNestjsAuth(), crud.createPayload);
                const nestjsId = (nestjsCreate.data as { ID?: number }).ID;

                await requestBuilder.makeRequest(NESTJS_API_URL, new Endpoint("DeleteObject", "DELETE", `/${className}/DeleteObject`, {ID: nestjsId}), GetNestjsAuth());

                // 410 Gone is geen 2xx, dus axios verwerpt de promise net als bij elke andere foutstatus
                await expect(requestBuilder.makeRequest(NESTJS_API_URL, new Endpoint("RemoveObject", "DELETE", `/${className}/RemoveObject`, {ID: nestjsId}), GetNestjsAuth()))
                    .rejects.toMatchObject({response: {status: 410}});

                await expect(requestBuilder.makeRequest(NESTJS_API_URL, new Endpoint("GetObject", "GET", `/${className}/GetObject`, {ID: nestjsId}), GetNestjsAuth()))
                    .rejects.toMatchObject({response: {status: 404}});
            }, 40000);
        }
    });
}
