/**
 * Auth will handel higher level register
 *
 * Register
 * Logout
 *
 */
import { Connection } from 'typeorm';

import { TestClient } from 'utils/testClient';
import { dbConnect } from 'server/db';

import { findUserByEmail, register } from './utils';
import { toTitleCase } from 'utils/funcs';

let conn: Connection;

beforeAll(async () => {
    conn = await dbConnect();
});

afterAll(async () => {
    await conn.close();
});

describe('find user', (): void => {
    test('user does not exists', async (): Promise<void> => {
        const { email, name } = TestClient.createCredentials();
        await register({ email, name });

        const { email: email2 } = TestClient.createCredentials();

        const user = await findUserByEmail(email2);
        expect(user).toEqual(undefined);
    });

    test('user exists', async (): Promise<void> => {
        const { email, name } = TestClient.createCredentials();
        await register({ email, name });

        const user = await findUserByEmail(email);
        expect(user).not.toEqual(undefined);
    });

    test('incorrect case does not fail', async (): Promise<void> => {
        const { email, name } = TestClient.createCredentials();
        await register({ email, name });

        const user = await findUserByEmail(email.toUpperCase());
        expect(user).not.toEqual(undefined);
    });
});

describe('register user', (): void => {
    test('fail for one email which exists', async (): Promise<void> => {
        const { email, name } = TestClient.createCredentials();
        await register({ email, name });
        await expect(register({ email, name })).rejects.toThrowError();
    });

    test('validation failed for user email', async (): Promise<void> => {
        const { name } = TestClient.createCredentials();
        await expect(register({ email: 'fakeEmail', name })).rejects.toThrowError();
    });

    test('validation failed for user name', async (): Promise<void> => {
        const { email } = TestClient.createCredentials();
        await expect(register({ email, name: '' })).rejects.toThrowError();
    });

    test('register user', async (): Promise<void> => {
        const { email, name } = TestClient.createCredentials();
        const data = await register({ email: email, name: name });
        const user = await findUserByEmail(email);

        expect(user).not.toEqual(undefined);
        expect(user?.email).toEqual(data.email);
        expect(user?.id).toEqual(data.id);
    });

    test('register user and case transformation', async (): Promise<void> => {
        const { email, name } = TestClient.createCredentials();
        await register({ email: email.toUpperCase(), name: name.toUpperCase() });
        const user = await findUserByEmail(email.toUpperCase());

        expect(user).not.toEqual(undefined);
        expect(user?.email).toEqual(email.toLowerCase());
        expect(user?.name).toEqual(toTitleCase(name));
    });
});

describe('logout', () => {
    test('logout success', async (): Promise<void> => {
        const session = new TestClient();
        const { email } = await session.register();
        await session.login(email);

        const me = await session.me();
        expect(me?.email).toEqual(email);

        await session.logout();
        const afterLogout = await session.me();
        expect(afterLogout).toEqual(null);
    });

    test('logout success even not login', async (): Promise<void> => {
        const session = new TestClient();
        await session.register();

        const me = await session.me();
        expect(me).toEqual(null);
    });

    test('logout from one session', async (): Promise<void> => {
        const session1 = new TestClient();
        const session2 = new TestClient();

        const { email } = await session1.register();

        await session1.login(email);
        expect((await session1.me()).email).toEqual(email);

        await session2.login(email);
        expect((await session2.me()).email).toEqual(email);

        await session1.logout();
        expect((await session2.me()).email).toEqual(email);
    });

    test('logout from all session', async (): Promise<void> => {
        const session1 = new TestClient();
        const session2 = new TestClient();

        const { email } = await session1.register();

        await session1.login(email);
        await session2.login(email);

        await session1.logout(true);
        expect(await session2.me()).toEqual(null);
    });
});
