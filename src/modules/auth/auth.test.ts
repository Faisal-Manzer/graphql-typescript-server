/**
 * Auth will handel higher level register
 *
 * Register
 * Logout
 *
 */
import { Connection } from 'typeorm';

import { TestClient } from 'utils/testClient';
import { User } from 'entity/User';
import { dbConnect } from 'server/db';

import { findUserByEmail } from './utils';

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
        await User.create({ email, name }).save();

        const { email: email2 } = TestClient.createCredentials();

        const user = await findUserByEmail(email2);
        expect(user).toEqual(undefined);
    });

    test('user exists', async (): Promise<void> => {
        const { email, name } = TestClient.createCredentials();
        await User.create({ email, name }).save();

        const user = await findUserByEmail(email);
        expect(user).not.toEqual(undefined);
    });

    test('incorrect case does not fail', async (): Promise<void> => {
        const { email, name } = TestClient.createCredentials();
        await User.create({ email, name }).save();
    });
});

describe('register user', (): void => {
    test('fail for one email which exists', async (): Promise<void> => {});

    test('fail for emails which exists', async (): Promise<void> => {});

    test('validation failed for user email', async (): Promise<void> => {});
});

describe('login user', (): void => {
    /* No test here, all the sub module will test this */
    test('placeholder test', async (): Promise<void> => {});
});
