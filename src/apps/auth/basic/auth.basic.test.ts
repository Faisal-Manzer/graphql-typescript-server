/**
 * Auth.Basic will handle password email based authentication.
 *
 * Register with password
 * Login with password
 * ChangePassword
 */
import { Connection } from 'typeorm';

import { dbConnect } from 'server/db';
import { TestClient } from 'utils/testClient';
import { LOGIN_REQUIRED_EXCEPTION, UNKNOWN_EXCEPTION, VALIDATION_EXCEPTION } from 'apps/exceptions';

import { USER_DOES_NOT_EXIST } from '../exceptions';

import { getBasicAuthUsingEmail } from './utils';
import { BasicAuth } from './entities/BasicAuth';
import { INVALID_CREDENTIALS_EXCEPTION, OLD_PASSWORD_USED_EXCEPTION } from './exceptions';

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

    test('no user', async () => {
        const session = new TestClient();
        const { email, password: oldPassword, name } = TestClient.createCredentials();
        await session.query(registerQuery(email, oldPassword, name));
        await session.login(email);

        const auth = await getBasicAuthUsingEmail(email);
        if (auth) {
            const user = auth.user;
            await auth.remove();
            await user.remove();
        }

        const { password: newPassword } = TestClient.createCredentials();
        const data = await session.query(changePasswordQuery(newPassword, oldPassword));
        changePasswordException(data)(UNKNOWN_EXCEPTION, null);
    });

    test('using old password', async () => {
        const session = new TestClient();
        const { email, password: oldPassword, name } = TestClient.createCredentials();
        await session.query(registerQuery(email, oldPassword, name));
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
        await session.login(email);

        const data = await session.query(changePasswordQuery('short', oldPassword));
        changePasswordException(data)(VALIDATION_EXCEPTION, 'newPassword');
    });

    test('change password success', async () => {
        const session = new TestClient();
        const { email, password: oldPassword, name } = TestClient.createCredentials();
        await session.query(registerQuery(email, oldPassword, name));
        await session.login(email);

        const { password: newPassword } = TestClient.createCredentials();
        const { changePassword } = await session.query(changePasswordQuery(newPassword, oldPassword));
        expect(changePassword.done).toEqual(true);
    });
});
