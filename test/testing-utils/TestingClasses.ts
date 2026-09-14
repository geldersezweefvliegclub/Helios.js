import axios, {AxiosBasicCredentials, AxiosResponse} from "axios";
import {Logger} from "@nestjs/common";

export class Endpoint {
    constructor(public name: string, public method: string, public path: string, public queryParams?: Record<string, unknown>) {
    }
}

export class EndpointGroup {
    constructor(public name: string, public endpoints: Endpoint[]) {
    }
}

export class RequestBuilder {
    private readonly logger = new Logger(RequestBuilder.name);

    async makeRequest(baseurl: string, endpoint: Endpoint, auth: AxiosBasicCredentials | null, body?: unknown): Promise<AxiosResponse> {
        let request: Promise<AxiosResponse>;

        const url = baseurl + endpoint.path;
        const config = {
            params: endpoint.queryParams,
            auth: auth,
            timeout: 30000,
        };

        switch (endpoint.method) {
            case 'GET':
                request = axios.get(url, config);
                break;
            case 'POST':
                request = axios.post(url, body, config);
                break;
            case 'PUT':
                request = axios.put(url, body, config);
                break;
            case 'PATCH':
                request = axios.patch(url, body, config);
                break;
            case 'DELETE':
                request = axios.delete(url, config);
                break;
            default:
                throw new Error(`Unsupported method: ${endpoint.method}`);
        }

        try {
            this.logger.log(`Making a request to "${url}". Query parameters:`, endpoint.queryParams);
            await request;
        } catch (e) {
            this.logger.error(`An error occurred while making a request to "${url}": ${JSON.stringify(e)}`);
            throw e;
        }

        return request;
    }
}