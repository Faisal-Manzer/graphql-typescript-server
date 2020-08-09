import { Connection } from 'typeorm';
import { dbConnect } from 'server/db';
import { TestClient } from 'utils/testClient';
import { LOGIN_REQUIRED_EXCEPTION, UNKNOWN_EXCEPTION, VALIDATION_EXCEPTION } from 'apps/exceptions';

import { getBasicAuthUsingEmail } from '../utils';
import { OLD_PASSWORD_USED_EXCEPTION } from '../exceptions';

import { registerQuery } from '../testUtils';

let conn: Connection;

beforeAll(async () => {
    conn = await dbConnect();
});

afterAll(async () => {
    await conn.close();
});

const changePasswordQuery = (newPassword: string, oldPassword: string | null = null): string => `
    mutation {
        changePassword (newPassword: "${newPassword}", ${oldPassword ? `, oldPassword: "${oldPassword}"` : ''}) {
            __typename
            
            ... on Exceptions {
                exceptions {
                    code
                    path
                }
            }
            
            ... on Done {
                done
            }
        }
    }
`;
const changePasswordException = TestClient.checkError('changePassword');

describe('change password', () => {
    test('exception without login', async () => {
        const session = new TestClient();
        const { email, password: oldPassword, name } = TestClient.createCredentials();
        await session.query(registerQuery(email, oldPassword, name));

        const { password: newPassword } = TestClient.createCredentials();
        const data = await session.query(changePasswordQuery(newPassword, oldPassword));
        await changePasswordException(data)(LOGIN_REQUIRED_EXCEPTION, null);
    });

    test('using old password', async () => {
        const session = new TestClient();
        const { email, password: oldPassword, name } = TestClient.createCredentials();
        await session.query(registerQuery(email, oldPassword, name));
        await session.verifyUser(email);
        await session.login(email);

        const auth = await getBasicAuthUsingEmail(email);
        if (auth) {
            const { password } = TestClient.createCredentials();
            await auth.setPassword(password);
            await auth.save();
        }

        const { password: newPassword } = TestClient.createCredentials();
        const data = await session.query(changePasswordQuery(newPassword, oldPassword));
        changePasswordException(data)(OLD_PASSWORD_USED_EXCEPTION, 'oldPassword');
    });

    test('credentials not found added new password', async () => {
        const session = new TestClient();
        const { email } = await session.register();
        await session.login(email);
        const { password: newPassword } = TestClient.createCredentials();

        const { changePassword } = await session.query(changePasswordQuery(newPassword));
        expect(changePassword.done).toEqual(true);
    });

    test('credentials not found but provided a password', async () => {
        const session = new TestClient();
        const { email } = await session.register();
        await session.login(email);
        const { password: oldPassword } = TestClient.createCredentials();
        const { password: newPassword } = TestClient.createCredentials();

        const data = await session.query(changePasswordQuery(newPassword, oldPassword));
        changePasswordException(data)(UNKNOWN_EXCEPTION, null);
    });

    test('new password not validated', async () => {
        const session = new TestClient();
        const { email, password: oldPassword, name } = TestClient.createCredentials();
        await session.query(registerQuery(email, oldPassword, name));
        await session.verifyUser(email);
        await session.login(email);

        const data = await session.query(changePasswordQuery('short', oldPassword));
        changePasswordException(data)(VALIDATION_EXCEPTION, 'newPassword');
    });

    test('change password success', async () => {
        const session = new TestClient();
        const { email, password: oldPassword, name } = TestClient.createCredentials();
        await session.query(registerQuery(email, oldPassword, name));
        await session.verifyUser(email);
        await session.login(email);

        const { password: newPassword } = TestClient.createCredentials();
        const { changePassword } = await session.query(changePasswordQuery(newPassword, oldPassword));
        expect(changePassword.done).toEqual(true);
    });
});
