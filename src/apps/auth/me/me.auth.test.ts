import { Connection } from 'typeorm';

import { TestClient } from 'utils/testClient';
import { dbConnect } from 'server/db';

let conn: Connection;

beforeAll(async () => {
    conn = await dbConnect();
});

afterAll(async () => {
    await conn.close();
});

describe('me', () => {
    test('me is null when not login', async () => {
        const session = new TestClient();
        const me = await session.me();
        expect(me).toEqual(null);
    });

    test('me is returned for unverified user', async () => {
        const session = new TestClient();
        const { email } = await session.register(false);
        await session.login(email);
        const { email: meEmail } = await session.me();
        expect(meEmail).toEqual(email);
    });

    test('me after login', async () => {
        const session = new TestClient();
        const { email } = await session.register();
        await session.login(email);
        const { email: meEmail } = await session.me();
        expect(meEmail).toEqual(email);
    });

    test('me is null after logout', async () => {
        const session = new TestClient();
        const { email } = await session.register();

        await session.login(email);
        const { email: meEmail } = await session.me();
        expect(meEmail).toEqual(email);

        await session.logout();
        const me = await session.me();
        expect(me).toEqual(null);
    });
});
