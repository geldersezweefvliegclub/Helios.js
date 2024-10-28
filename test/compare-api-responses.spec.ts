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

    const endpoints = [
        new EndpointGroup('TypesGroepen', [
            new Endpoint("GetObject", "GET", "/TypesGroepen/GetObject", {ID: 1}),
            new Endpoint('GetObjects ID', 'GET', '/TypesGroepen/GetObjects', {ID: 1}),
            new Endpoint('GetObjects Max', 'GET', '/TypesGroepen/GetObjects', {MAX: 2}),
            new Endpoint('GetObjects Sort ID ASC', 'GET', '/TypesGroepen/GetObjects', {SORT: 'ID'}),
            new Endpoint('GetObjects Sort ID DESC', 'GET', '/TypesGroepen/GetObjects', {SORT: 'ID DESC'}),
            new Endpoint('GetObjects', 'GET', '/TypesGroepen/GetObjects'),
            new Endpoint('GetObjects Velden', 'GET', '/TypesGroepen/GetObjects', {MAX: 2, VELDEN: 'ID, OMSCHRIJVING'}),
        ]),
        new EndpointGroup('Types', [
            new Endpoint("GetObject", "GET", "/Types/GetObject", {ID: 1}),
            new Endpoint('GetObjects ID', 'GET', '/Types/GetObjects', {ID: 601}),
            new Endpoint('GetObjects Max', 'GET', '/Types/GetObjects', {MAX: 2}),
            new Endpoint('GetObjects Sort ID ASC', 'GET', '/Types/GetObjects', {SORT: 'ID'}),
            new Endpoint('GetObjects Sort ID DESC', 'GET', '/Types/GetObjects', {SORT: 'ID DESC'}),
            new Endpoint('GetObjects GetObjects', 'GET', '/Types/GetObjects'),
            new Endpoint('GetObjects Groep = 1', 'GET', '/Types/GetObjects', {GROEP: 1}),
            new Endpoint('GetObjects Velden', 'GET', '/Types/GetObjects', {MAX: 2, VELDEN: 'ID, OMSCHRIJVING'}),
        ]),
    ];

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
                    const nestjsResponseDataWithoutHash = {...nestjsResponse.data, ...{hash: undefined}};
                    const phpResponseDataWithoutHash = {...phpResponse.data, ...{hash: undefined}};

                    expect(nestjsResponse.status).toEqual(phpResponse.status);
                    logger.log('Comparison of status codes completed: success');

                    logger.log('Comparing response bodies...');
                    expect(nestjsResponseDataWithoutHash).toEqual(phpResponseDataWithoutHash);
                    logger.log('Comparison of response bodies completed: success');
                }, 20000);
            }
        });
    }
});
