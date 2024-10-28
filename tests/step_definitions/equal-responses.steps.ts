import {BeforeAll, Given, Then} from '@cucumber/cucumber';
import {config} from "dotenv";
import * as process from "node:process";

config();

let originalApiResponse: unknown;
let currentApiResponse: unknown;

const basicAuthHeader = (username: string, password: string) => {
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    return `Basic ${credentials}`;
};

Given('I call the original API at {string} with entity {string}, action {string}, and params {string}',
    async (hostname: string, entity: string, action: string, params: string) => {
        const url = `${hostname}/${entity}/${action}?${params}`;
        const response = await fetch(url, {
            headers: {
                Authorization: basicAuthHeader(process.env.TESTING_USERNAME, process.env.TESTING_PASSWORD)
            }
        });
        originalApiResponse = await response.json();
    }
);

Given('I call the current API at {string} with entity {string}, action {string}, and params {string}',
    async (hostname: string, entity: string, action: string, params: string) => {
        const url = `${hostname}/${entity}/${action}?${params}`;
        const response = await fetch(url);
        currentApiResponse = await response.json();
    }
);

Then('the response from the original API should match the response from the current API', () => {
    expect(currentApiResponse).toEqual(originalApiResponse);
});
