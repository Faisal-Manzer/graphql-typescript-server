import { jar, post } from 'request-promise';
import request from 'request';
import { v4 as uuid } from 'uuid';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';

interface User {
    email: string;
    name: string;
    id: string;
}

interface RandomCredentials {
    email: string;
    password: string;
    name: string;
}

interface NewUser {
    email: string;
    name: string;
    user: User;
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

    static checkError(qt: string) {
        return (data: any) => (errorCode: any, path: string | null): void => {
            const res = data[qt];
            expect(res?.__typename).toEqual('Exceptions');
            expect(res?.exceptions).toEqual(
                expect.arrayContaining([
                    {
                        code: errorCode,
                        path,
                    },
                ]),
            );
        };
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

    async registerUser(email: string, name: string, autoVerify = true): Promise<NewUser> {
        const query = `
        mutation {
            testRegister(email: "${email}", name: "${name}") {
                id
                email
                name
            }
        }`;
        const data = await this.query(query);
        if (autoVerify) {
            const verifyQuery = `
                mutation {
                    testVerify (email: "${email}")
                }
            `;
            await this.query(verifyQuery);
        }
        return { email, name, user: data.testRegister };
    }

    async login(email: string): Promise<any> {
        const query = `
        mutation {
            testLogin(email: "${email}") {
                id
                email
                name
            }
        }`;
        const data = await this.query(query);
        return { email, user: data.testLogin };
    }

    async register(autoVerify = true): Promise<NewUser> {
        const { email, name } = TestClient.createCredentials();
        return await this.registerUser(email, name, autoVerify);
    }

    async me(): Promise<User> {
        const query = `
        {
            me {
                id
                email
                name
                verified
            }
        }`;
        const data = await this.query(query);
        return data.me;
    }

    async logout(fromAll = false): Promise<void> {
        const query = `
        mutation { 
            logout (fromAll: ${fromAll})
        }`;
        await this.query(query);
    }

    async verifyUser(email: string): Promise<boolean> {
        const query = `
        mutation { 
            testVerify (email: "${email}")
        }`;
        const { testVerify } = await this.query(query);
        return testVerify as boolean;
    }
}
