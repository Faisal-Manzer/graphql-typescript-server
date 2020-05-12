/**
 * Auth will handel higher level register
 *
 * Register
 * Logout
 * Update Name
 * Send Conf Mail
 * Me
 *
 * Find User
 */

import { URL } from 'url';

import { Connection } from 'typeorm';
import fetch from 'node-fetch';

import { TestClient } from 'utils/testClient';
import { dbConnect } from 'server/db';

import { register, createVerificationLink, getVerificationURL } from './utils';
import { getRedisKeyForValue, toTitleCase } from 'utils/funcs';
import { LOGIN_REQUIRED_EXCEPTION, USER_NOT_VERIFIED, VALIDATION_EXCEPTION } from '../exceptions';
import { REDIS_VERIFY_USER } from '../../server/constants';
import { User } from '../entities/User';
import { findUserByEmail } from '../utils';

let conn: Connection;
const host = process.env.TEST_HOST || '';

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

const changeNameQuery = (name: string): string => `
    mutation {
        updateName (name: "${name}") {
            __typename
            
            ... on Done {
                done
            }
            
            ... on Exceptions {
                exceptions {
                    code
                    path
                }
            }
        }
    }
`;

const updateNameError = TestClient.checkError('updateName');
describe('update name', () => {
    test('should login to change name', async (): Promise<void> => {
        const session = new TestClient();
        const { name } = TestClient.createCredentials();
        await session.register();
        TestClient.checkError(changeNameQuery(name))({
            code: LOGIN_REQUIRED_EXCEPTION,
        });
    });

    test('only verified user', async (): Promise<void> => {
        const session = new TestClient();
        const { email } = await session.register(false);
        await session.login(email);
        const data = await session.query(changeNameQuery(''));
        updateNameError(data)(USER_NOT_VERIFIED, null);
    });

    test('name is required', async (): Promise<void> => {
        const session = new TestClient();
        const { email } = await session.register();
        await session.login(email);
        const data = await session.query(changeNameQuery(''));
        updateNameError(data)(VALIDATION_EXCEPTION, null);
    });

    test('change name success', async (): Promise<void> => {
        const session = new TestClient();
        const { name } = TestClient.createCredentials();
        const { email } = await session.register();
        await session.login(email);

        const { updateName } = await session.query(changeNameQuery(name));
        expect(updateName.done).toBeTruthy();
    });
});

const sendConfMailQuery = (email: string, redirect: string = host): string => `
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
        const { sendVerificationEmail } = await session.query(sendConfMailQuery(email, ''));
        expect(sendVerificationEmail).toEqual(false);
    });

    test('validate email', async () => {
        const session = new TestClient();
        await session.register(false);
        const { sendVerificationEmail } = await session.query(sendConfMailQuery('random-email'));
        expect(sendVerificationEmail).toEqual(false);
    });

    test('verify using query', async () => {
        const session = new TestClient();
        const { email } = await session.register(false);
        const { sendVerificationEmail } = await session.query(sendConfMailQuery(email));
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

        await session.query(sendConfMailQuery(email));
        const key = await getRedisKeyForValue(REDIS_VERIFY_USER, email);
        const link = getVerificationURL(host, key as string, host);
        await fetch(link);

        const userAfter = (await User.findOne({ where: { email } })) as User;
        expect(userAfter.verified).toEqual(true);
    });
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
