import { Connection } from 'typeorm';
import { dbConnect } from 'server/db';

import { TestClient } from 'utils/testClient';
import { VALIDATION_EXCEPTION } from 'apps/exceptions';

import { BasicAuth } from '../entities/BasicAuth';
import { registerQuery, registerException } from '../testUtils';

let conn: Connection;

beforeAll(async () => {
    conn = await dbConnect();
});

afterAll(async () => {
    await conn.close();
});

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
        const { register } = await session.query(registerQuery(email, password, name));

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
        expect(data?.register.__typename).toEqual('User');
        expect(data?.register.email).toEqual(email);
    });
});
