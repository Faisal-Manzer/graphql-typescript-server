import { jar, post } from 'request-promise';
import request from 'request';
import { v4 as uuid } from 'uuid';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';

interface RandomCredentials {
    email: string;
    password: string;
    name: string;
}

export class TestClient {
    url: string;
    options: request.CoreOptions;

    constructor(url: string = process.env.TEST_HOST as string, options: Partial<request.CoreOptions> = {}) {
        this.url = url;
        this.options = {
            withCredentials: true,
            jar: jar(),
            json: true,
            ...options,
        };
    }

    async query(query: string, raiseError = true): Promise<any> {
        const response = await post(this.url, { ...this.options, body: { query } });
        if (raiseError && response.error) throw new Error(`Query ${query} failed`);
        return response.data;
    }

    static createCredentials(): RandomCredentials {
        return {
            email: `${uuid()}@example.com`,
            password: `Pass:${uuid()}`,
            name: uniqueNamesGenerator({
                dictionaries: [adjectives, colors, animals],
                separator: ' ',
                length: 2,
            }),
        };
    }
}
