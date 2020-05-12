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
