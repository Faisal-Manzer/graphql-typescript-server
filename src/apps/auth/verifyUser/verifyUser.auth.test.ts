import fetch from 'node-fetch';
import { URL } from 'url';
import { Connection } from 'typeorm';

import { TestClient } from 'utils/testClient';
import { getRedisKeyForValue } from 'utils/funcs';
import { REDIS_VERIFY_USER } from 'server/constants';
import { dbConnect } from 'server/db';
import { User } from 'apps/entities/User';

import { createVerificationLink, getVerificationURL } from 'apps/auth/utils';

let conn: Connection;
const host = process.env.TEST_HOST || '';

beforeAll(async () => {
    conn = await dbConnect();
});

afterAll(async () => {
    await conn.close();
});

const sendVerificationEmailQuery = (email: string, redirect: string = host): string => `
    mutation {
        sendVerificationEmail (email: "${email}", redirect: "${redirect}")
    }
`;
describe('verify user', () => {
    const verifyUser = async (link: string, success: boolean, email: string): Promise<void> => {
        const response = await fetch(link);

        expect(response.redirected).toEqual(true);
        const redirect = new URL(response.url);
        expect(redirect.searchParams.get('success')).toEqual(success.toString());
        expect(redirect.searchParams.get('email')).toEqual(email);
    };

    test('create same link for same user', async () => {
        const session = new TestClient();
        const { user } = await session.register(false);

        const link1 = await createVerificationLink(host, user.id, host);
        const link2 = await createVerificationLink(host, user.id, host);

        expect(link1).toEqual(link2);
    });

    test('create different link for different user', async () => {
        const session = new TestClient();
        const { email: email1 } = await session.register(false);
        const { email: email2 } = await session.register(false);

        const link1 = await createVerificationLink(host, email1, host);
        const link2 = await createVerificationLink(host, email2, host);

        expect(link1).not.toEqual(link2);
    });

    test('random id', async () => {
        const { email } = TestClient.createCredentials();
        const link = getVerificationURL(host, email, host);
        await verifyUser(link, false, '');
    });

    test('link confirms', async () => {
        const session = new TestClient();
        const { email } = await session.register(false);

        const link = await createVerificationLink(host, email, host);
        await verifyUser(link, true, email);
    });

    test('link invalidates', async () => {
        const session = new TestClient();
        const { email } = await session.register(false);

        const link = await createVerificationLink(host, email, host);
        await fetch(link);
        await verifyUser(link, false, '');
    });

    test('verify non http', async () => {
        const session = new TestClient();
        const { email } = await session.register(false);

        const link = await createVerificationLink(host, email, host.replace(/(^\w+:|^)\/\//, ''));
        await verifyUser(link, true, email);
    });

    test('validate redirect', async () => {
        const session = new TestClient();
        const { email } = await session.register(false);
        const { sendVerificationEmail } = await session.query(sendVerificationEmailQuery(email, ''));
        expect(sendVerificationEmail).toEqual(false);
    });

    test('validate email', async () => {
        const session = new TestClient();
        await session.register(false);
        const { sendVerificationEmail } = await session.query(sendVerificationEmailQuery('random-email'));
        expect(sendVerificationEmail).toEqual(false);
    });

    test('verify using query', async () => {
        const session = new TestClient();
        const { email } = await session.register(false);
        const { sendVerificationEmail } = await session.query(sendVerificationEmailQuery(email));
        expect(sendVerificationEmail).toEqual(true);
        const key = await getRedisKeyForValue(REDIS_VERIFY_USER, email);
        expect(key).not.toEqual(null);
        if (key) {
            const link = getVerificationURL(host, key, host);
            await verifyUser(link, true, email);
        }
    });

    test('verified with db', async () => {
        const session = new TestClient();
        const { email } = await session.register(false);
        const userBefore = (await User.findOne({ where: { email } })) as User;
        expect(userBefore.verified).toEqual(false);

        await session.query(sendVerificationEmailQuery(email));
        const key = await getRedisKeyForValue(REDIS_VERIFY_USER, email);
        const link = getVerificationURL(host, key as string, host);
        await fetch(link);

        const userAfter = (await User.findOne({ where: { email } })) as User;
        expect(userAfter.verified).toEqual(true);
    });
});
