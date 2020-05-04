/**
 * Auth.Basic will handle password email based authentication.
 *
 * Register
 * Login
 *
 */
import { Connection } from 'typeorm';

import { dbConnect } from 'server/db';
import { TestClient } from 'utils/testClient';
import { VALIDATION_EXCEPTION } from 'modules/exceptions';
import { BasicAuth } from './entity/BasicAuth';
import { INVALID_CREDENTIALS_EXCEPTION } from './exceptions';
import { USER_DOES_NOT_EXIST } from '../exceptions';

let conn: Connection;

beforeAll(async () => {
    conn = await dbConnect();
});

afterAll(async () => {
    await conn.close();
});

const registerException = TestClient.checkError('registerWithPassword');
const registerQuery = (email: string, password: string, name: string): string => `
    mutation {
        registerWithPassword(email: "${email}", password: "${password}", name: "${name}") {
            __typename
            
            ... on Exceptions {
                exceptions {
                    code
                    path
                }
            }
            
            ... on User {
                id
                email
            }
        }
    }
`;

const loginException = TestClient.checkError('loginWithPassword');
const loginQuery = (email: string, password: string): string => `
    mutation {
        loginWithPassword(email: "${email}", password: "${password}") {
            __typename
            
            ... on Exceptions {
                exceptions {
                    code
                    path
                }
            }
            
            ... on User {
                id
                email
            }
        }
    }
`;

describe('basic registration', (): void => {
    test('password is required', async (): Promise<void> => {
        const { email, name } = TestClient.createCredentials();
        const session = new TestClient();
        const data = await session.query(registerQuery(email, '', name));
        registerException(data)(VALIDATION_EXCEPTION, 'password');
    });

    test('password should be minimum 6 digit', async (): Promise<void> => {
        const { email, name } = TestClient.createCredentials();
        const session = new TestClient();
        const data = await session.query(registerQuery(email, 'nnn', name));
        registerException(data)(VALIDATION_EXCEPTION, 'password');
    });

    test('email required', async (): Promise<void> => {
        const { name, password } = TestClient.createCredentials();
        const session = new TestClient();
        const data = await session.query(registerQuery('wrong_email', password, name));
        registerException(data)(VALIDATION_EXCEPTION, 'email');
    });

    test('password is required', async (): Promise<void> => {
        const { email, name } = TestClient.createCredentials();
        const session = new TestClient();
        const data = await session.query(registerQuery(email, '', name));
        registerException(data)(VALIDATION_EXCEPTION, 'password');
    });

    test('password is hashed', async (): Promise<void> => {
        const { email, name, password } = TestClient.createCredentials();
        const session = new TestClient();
        const { registerWithPassword: register } = await session.query(registerQuery(email, password, name));

        const auth = await BasicAuth.findOne({
            where: { user: { id: register.id } },
            relations: ['user'],
        });
        expect(auth?.user.id).toEqual(register.id);
        expect(auth?.password).not.toEqual(password);
        expect(auth?.oldPasswords).toHaveLength(0);
    });

    test('register user', async (): Promise<void> => {
        const { email, name, password } = TestClient.createCredentials();
        const session = new TestClient();
        const data = await session.query(registerQuery(email, password, name));
        expect(data?.registerWithPassword.__typename).toEqual('User');
        expect(data?.registerWithPassword.email).toEqual(email);
    });
});

describe('basic login', (): void => {
    test('wrong password', async (): Promise<void> => {
        const { email, name, password } = TestClient.createCredentials();
        const session = new TestClient();
        await session.query(registerQuery(email, password, name));

        const data = await session.query(loginQuery(email, 'random-wrong-password'));
        loginException(data)(INVALID_CREDENTIALS_EXCEPTION, null);

        const me = await session.me();
        expect(me).toEqual(null);
    });

    test('wrong email', async (): Promise<void> => {
        const { email, name, password } = TestClient.createCredentials();
        const session = new TestClient();
        await session.query(registerQuery(email, password, name));

        const data = await session.query(loginQuery('incorrectEmail', password));
        loginException(data)(USER_DOES_NOT_EXIST, null);
    });

    test('login success', async (): Promise<void> => {
        const { email, name, password } = TestClient.createCredentials();
        const session = new TestClient();
        const { registerWithPassword: register } = await session.query(registerQuery(email, password, name));

        const { loginWithPassword: login } = await session.query(loginQuery(email, password));
        expect(login?.id).toEqual(register.id);

        const me = await session.me();
        expect(me?.id).toEqual(register.id);
    });
});
