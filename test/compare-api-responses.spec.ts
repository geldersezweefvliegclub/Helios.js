/**
 * In this file we call the PHP API and the new NestJS API, with the same endpoint and parameters.
 * Then, to validate if the NestJS API is working correctly, we compare the response of both APIs.
 * If the responses are the same, the test passes.
 *
 * Both APIs must be running for this test to work.
 */

import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication, Logger} from '@nestjs/common';
import {AppModule} from '../src/app.module';
import {Endpoint, EndpointGroup, RequestBuilder} from "./testing-utils/TestingClasses";
import {config} from "dotenv";

config();

const logger = new Logger('API Response Comparison (e2e)');

function GetPhpAuth() {
    if (!process.env.TESTING_PHP_USERNAME || !process.env.TESTING_PHP_PASSWORD) {
        return null;
    }

    return {
        username: process.env.TESTING_PHP_USERNAME,
        password: process.env.TESTING_PHP_PASSWORD
    };
}

function GetNestjsAuth() {
    if (!process.env.TESTING_NESTJS_USERNAME || !process.env.TESTING_NESTJS_PASSWORD) {
        return null;
    }

    return {
        username: process.env.TESTING_NESTJS_USERNAME,
        password: process.env.TESTING_NESTJS_PASSWORD
    };
}

describe('API Response Comparison (e2e)', () => {
    let app: INestApplication;
    let requestBuilder: RequestBuilder;

    const NESTJS_API_URL = process.env.TESTING_NESTJS_URL;
    const PHP_API_URL = process.env.TESTING_PHP_URL;

    const classes = [
      //  { class: "TypesGroepen", ID: 5},
      //  { class: "Types", ID: 601 },
      //  { class: "Leden", ID: 10395 },
      //   { class: "Vliegtuigen", ID: 200 },
      //  { class: "Competenties", ID: 35 },
      //  { class: "Journaal", ID: 2, BEGIN_DATUM: "2024-01-01", EIND_DATUM: "2024-12-31" },
        { class: "Agenda", ID: 2, BEGIN_DATUM: "2024-01-01", EIND_DATUM: "2024-12-31" },
        { class: "Documenten", ID: 20 },
    ]

    const endpoints= [];
    classes.forEach(heliosClass =>
    {
        const qry = {}
        if (heliosClass.BEGIN_DATUM)
            qry['BEGIN_DATUM'] = heliosClass.BEGIN_DATUM
        if (heliosClass.EIND_DATUM)
            qry['EIND_DATUM'] = heliosClass.EIND_DATUM

        endpoints.push(
           new EndpointGroup(heliosClass.class, [
                new Endpoint("A. GetObject", "GET", `/${heliosClass.class}/GetObject`,  {ID: heliosClass.ID}),
                new Endpoint("B. GetObjects", "GET", `/${heliosClass.class}/GetObjects`, {ID: heliosClass.ID}),
                new Endpoint("C. GetObjects", "GET", `/${heliosClass.class}/GetObjects`, {...qry, MAX: 2}),
                new Endpoint("D. GetObjects", "GET", `/${heliosClass.class}/GetObjects`, {...qry,START:4, MAX: 2}),
                new Endpoint("E. GetObjects", "GET", `/${heliosClass.class}/GetObjects`, {...qry,SORT: 'ID'}),
                new Endpoint("F. GetObjects", "GET", `/${heliosClass.class}/GetObjects`, {...qry,SORT: 'ID DESC'}),
                new Endpoint("G. GetObjects", "GET", `/${heliosClass.class}/GetObjects`, {...qry,VERWIJDERD: true}),
                new Endpoint("H. GetObjects", "GET", `/${heliosClass.class}/GetObjects`, {...qry}),
            ])
        );
    });

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    beforeEach(async () => {
        requestBuilder = new RequestBuilder();
    });

    for (const endpointGroup of endpoints) {
        describe(`${endpointGroup.name}`, () => {
            for (const endpoint of endpointGroup.endpoints) {
                it(`${endpoint.name} - Compare PHP API and NestJS API response`, async () => {
                    const nestjsResponse = await requestBuilder.makeRequest(NESTJS_API_URL, endpoint, GetNestjsAuth());
                    const phpResponse = await requestBuilder.makeRequest(PHP_API_URL, endpoint, GetPhpAuth());

                    // The hash will always be different across the two APIs, so we remove it from the response to compare the rest of the data
                    const nestjsCompare = {...nestjsResponse.data, ...{hash: undefined, LAATSTE_AANPASSING: undefined}};
                    let phpCompare = {...phpResponse.data, ...{hash: undefined, LAATSTE_AANPASSING: undefined, laatste_aanpassing: undefined}};

                    // verwijderen van LAATSTE_AANPASSING omdat deze niet altijd hetzelfde is
                    if (nestjsCompare.dataset)
                    {
                        for (let i = 0; i < nestjsCompare.dataset.length; i++)
                        {
                            nestjsCompare.dataset[i] = {...nestjsCompare.dataset[i], ...{LAATSTE_AANPASSING: undefined}};
                        }
                    }

                    if (phpCompare.dataset)
                    {
                        for (let i = 0; i < phpCompare.dataset.length; i++)
                        {
                            phpCompare.dataset[i] = {...phpCompare.dataset[i], ...{LAATSTE_AANPASSING: undefined}};
                        }
                    }
                    // done

                    // veld aanpassen voor
                    switch (endpointGroup.name)
                    {
                        case "Types":
                        {
                            if (endpoint.name.includes("GetObjects"))
                            {
                                for (let i = 0; i < nestjsCompare.dataset.length; i++)
                                    delete nestjsCompare.dataset[i].GROEP

                                for (let i = 0; i < phpCompare.dataset.length; i++)
                                {
                                    const { GROEP, ...record} = phpCompare.dataset[i];
                                    record.TYPEGROEP_ID = GROEP
                                    phpCompare.dataset[i] = record
                                }
                            }
                            else
                            {
                                const { GROEP, ...record} = phpCompare;
                                record.TYPEGROEP_ID = GROEP
                                phpCompare = record;
                            }
                            break;
                        }

                        case "Leden":
                        {
                            if (endpoint.name.includes("GetObjects"))
                            {
                                for (let i = 0; i < nestjsCompare.dataset.length; i++)
                                {
                                    delete nestjsCompare.dataset[i].BRANDSTOF_PAS
                                    delete nestjsCompare.dataset[i].GEBOORTE_DATUM
                                    delete nestjsCompare.dataset[i].MEDICAL
                                    delete nestjsCompare.dataset[i].WACHTWOORD
                                    delete nestjsCompare.dataset[i].SECRET
                                }

                                for (let i = 0; i < phpCompare.dataset.length; i++)
                                {
                                    delete phpCompare.dataset[i].GEBOORTE_DATUM
                                    delete phpCompare.dataset[i].MEDICAL
                                    delete phpCompare.dataset[i].WACHTWOORD
                                    delete phpCompare.dataset[i].SECRET
                                }
                            }
                            else
                            {
                                delete nestjsCompare.BRANDSTOF_PAS;
                                delete nestjsCompare.GEBOORTE_DATUM
                                delete nestjsCompare.MEDICAL
                                delete nestjsCompare.WACHTWOORD
                                delete nestjsCompare.SECRET

                                delete phpCompare.BRANDSTOF_PAS;
                                delete phpCompare.GEBOORTE_DATUM
                                delete phpCompare.MEDICAL
                                delete phpCompare.WACHTWOORD
                                delete phpCompare.SECRET
                            }
                            break;
                        }

                        case "Competenties":
                        {
                            if (endpoint.name.includes("GetObjects"))
                            {
                                for (let i = 0; i < phpCompare.dataset.length; i++)
                                {
                                    const { BLOK_ID, ONDERWERP, ...record} = phpCompare.dataset[i];
                                    record.OUDER_ID = BLOK_ID
                                    record.OMSCHRIJVING = ONDERWERP
                                    phpCompare.dataset[i] = record
                                }
                            }
                            else
                            {
                                const { BLOK_ID, ONDERWERP, ...record} = phpCompare;
                                record.OUDER_ID = BLOK_ID
                                record.OMSCHRIJVING = ONDERWERP
                                phpCompare = record;
                            }
                            break;
                        }

                        case "Agenda":
                        {
                            if (endpoint.name.includes("GetObjects"))
                            {
                                for (let i = 0; i < nestjsCompare.dataset.length; i++)
                                {
                                    delete nestjsCompare.dataset[i].DATUM
                                }

                                for (let i = 0; i < phpCompare.dataset.length; i++)
                                {
                                    delete phpCompare.dataset[i].DATUM
                                    delete phpCompare.dataset[i].TIJD
                                }
                            }
                            else
                            {
                                delete nestjsCompare.DATUM
                                delete phpCompare.DATUM
                                delete phpCompare.TIJD
                            }
                            break;
                        }
                        case "Documenten":
                        {
                            if (endpoint.name.includes("GetObjects"))
                            {
                                for (let i = 0; i < nestjsCompare.dataset.length; i++)
                                {
                                    delete nestjsCompare.dataset[i].DATUM
                                    delete nestjsCompare.dataset[i].NAAM
                                }

                                for (let i = 0; i < phpCompare.dataset.length; i++)
                                {
                                    delete phpCompare.dataset[i].DATUM
                                }
                            }
                            else
                            {
                                delete nestjsCompare.DATUM
                                delete phpCompare.DATUM
                            }
                            break;
                        }
                        case "Journaal":
                        {
                            if (endpoint.name.includes("GetObjects"))
                            {
                                for (let i = 0; i < nestjsCompare.dataset.length; i++)
                                {
                                    delete nestjsCompare.dataset[i].DATUM
                                }

                                for (let i = 0; i < phpCompare.dataset.length; i++)
                                {
                                    delete phpCompare.dataset[i].DATUM
                                }
                            }
                            else
                            {
                                delete nestjsCompare.DATUM
                                delete phpCompare.DATUM
                            }
                            break;
                        }
                    }

                    expect(nestjsResponse.status).toEqual(phpResponse.status);
                    logger.log('Comparison of status codes completed: success');

                    logger.log('Comparing response bodies...');
                    expect(nestjsCompare).toEqual(phpCompare);
                    logger.log('Comparison of response bodies completed: success');
                }, 20000);
            }
        });
    }
});
