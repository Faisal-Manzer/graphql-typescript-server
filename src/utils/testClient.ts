import { jar, post } from 'request-promise';
import request from 'request';

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
}
