/**
 * Auth.Basic will handle password email based authentication.
 *
 * Register with password
 * Login with password
 * Change Password
 * Forgot Password
 */
import { Connection } from 'typeorm';

import { dbConnect } from 'server/db';
import { TestClient } from 'utils/testClient';
import { getRandomInt } from 'utils/funcs';
import { REDIS_FORGOT_PASSWORD_PREFIX } from 'server/constants';
import { redis } from 'server/redis';
import { LOGIN_REQUIRED_EXCEPTION, UNKNOWN_EXCEPTION, VALIDATION_EXCEPTION } from 'apps/exceptions';

import { USER_DOES_NOT_EXIST } from '../exceptions';

import { getBasicAuthUsingEmail } from './utils';
import { BasicAuth } from './entities/BasicAuth';
import { INVALID_CREDENTIALS_EXCEPTION, INVALID_OTP_EXCEPTION, OLD_PASSWORD_USED_EXCEPTION } from './exceptions';

let conn: Connection;

beforeAll(async () => {
    conn = await dbConnect();
});

afterAll(async () => {
    await conn.close();
});

const registerWithPasswordException = TestClient.checkError('register');
const registerWithPasswordQuery = (email: string, password: string, name: string): string => `
    mutation {
        register(email: "${email}", password: "${password}", name: "${name}") {
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

const loginException = TestClient.checkError('login');
const loginQuery = (email: string, password: string): string => `
    mutation {
        login(email: "${email}", password: "${password}") {
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
        const data = await session.query(registerWithPasswordQuery(email, '', name));
        registerWithPasswordException(data)(VALIDATION_EXCEPTION, 'password');
    });

    test('password should be minimum 6 digit', async (): Promise<void> => {
        const { email, name } = TestClient.createCredentials();
        const session = new TestClient();
        const data = await session.query(registerWithPasswordQuery(email, 'nnn', name));
        registerWithPasswordException(data)(VALIDATION_EXCEPTION, 'password');
    });

    test('email required', async (): Promise<void> => {
        const { name, password } = TestClient.createCredentials();
        const session = new TestClient();
        const data = await session.query(registerWithPasswordQuery('wrong_email', password, name));
        registerWithPasswordException(data)(VALIDATION_EXCEPTION, 'email');
    });

    test('password is required', async (): Promise<void> => {
        const { email, name } = TestClient.createCredentials();
        const session = new TestClient();
        const data = await session.query(registerWithPasswordQuery(email, '', name));
        registerWithPasswordException(data)(VALIDATION_EXCEPTION, 'password');
    });

    test('password is hashed', async (): Promise<void> => {
        const { email, name, password } = TestClient.createCredentials();
        const session = new TestClient();
        const { register } = await session.query(registerWithPasswordQuery(email, password, name));

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
        const data = await session.query(registerWithPasswordQuery(email, password, name));
        expect(data?.register.__typename).toEqual('User');
        expect(data?.register.email).toEqual(email);
    });
});

describe('basic login', (): void => {
    test('wrong password', async (): Promise<void> => {
        const { email, name, password } = TestClient.createCredentials();
        const session = new TestClient();
        await session.query(registerWithPasswordQuery(email, password, name));

        const data = await session.query(loginQuery(email, 'random-wrong-password'));
        loginException(data)(INVALID_CREDENTIALS_EXCEPTION, null);

        const me = await session.me();
        expect(me).toEqual(null);
    });

    test('wrong email', async (): Promise<void> => {
        const { email, name, password } = TestClient.createCredentials();
        const session = new TestClient();
        await session.query(registerWithPasswordQuery(email, password, name));

        const data = await session.query(loginQuery('incorrectEmail', password));
        loginException(data)(USER_DOES_NOT_EXIST, null);
    });

    test('login success', async (): Promise<void> => {
        const { email, name, password } = TestClient.createCredentials();
        const session = new TestClient();
        const { register } = await session.query(registerWithPasswordQuery(email, password, name));

        const { login } = await session.query(loginQuery(email, password));
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
        await session.query(registerWithPasswordQuery(email, oldPassword, name));

        const { password: newPassword } = TestClient.createCredentials();
        const data = await session.query(changePasswordQuery(newPassword, oldPassword));
        await changePasswordException(data)(LOGIN_REQUIRED_EXCEPTION, null);
    });

    test('no user', async () => {
        const session = new TestClient();
        const { email, password: oldPassword, name } = TestClient.createCredentials();
        await session.query(registerWithPasswordQuery(email, oldPassword, name));
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
        await session.query(registerWithPasswordQuery(email, oldPassword, name));
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
        await session.query(registerWithPasswordQuery(email, oldPassword, name));
        await session.login(email);

        const data = await session.query(changePasswordQuery('short', oldPassword));
        changePasswordException(data)(VALIDATION_EXCEPTION, 'newPassword');
    });

    test('change password success', async () => {
        const session = new TestClient();
        const { email, password: oldPassword, name } = TestClient.createCredentials();
        await session.query(registerWithPasswordQuery(email, oldPassword, name));
        await session.login(email);

        const { password: newPassword } = TestClient.createCredentials();
        const { changePassword } = await session.query(changePasswordQuery(newPassword, oldPassword));
        expect(changePassword.done).toEqual(true);
    });
});

const sendForgetPasswordMailQuery = (email: string): string => `
    mutation {
        sendForgotPasswordMail (email: "${email}") {
            done
        }
    }
`;

const forgetPasswordQuery = (email: string, otp: number | string, password: string): string => `
    mutation {
        forgotPassword (email: "${email}", otp: ${otp}, password: "${password}") {
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
const forgotPasswordException = TestClient.checkError('forgotPassword');

describe('forgot password', () => {
    test('send mail user exist', async () => {
        const session = new TestClient();
        const { email, user } = await session.register();
        const { sendForgotPasswordMail } = await session.query(sendForgetPasswordMailQuery(email));
        expect(sendForgotPasswordMail.done).toEqual(true);
        const otp = await redis.get(`${REDIS_FORGOT_PASSWORD_PREFIX}:${user.id}`);
        expect(otp).not.toEqual(null);
    });

    test('send mail user not exist', async () => {
        const session = new TestClient();
        const { email } = TestClient.createCredentials();
        const { sendForgotPasswordMail } = await session.query(sendForgetPasswordMailQuery(email));
        expect(sendForgotPasswordMail.done).toEqual(true);
    });

    test('entered wrong otp', async () => {
        const session = new TestClient();
        const { email, user } = await session.register();
        const { password } = TestClient.createCredentials();
        await session.query(sendForgetPasswordMailQuery(email));
        const otp = JSON.parse((await redis.get(`${REDIS_FORGOT_PASSWORD_PREFIX}:${user.id}`)) as string);
        const newOtp = otp !== 999999 ? otp + 1 : otp - 1;
        const data = await session.query(forgetPasswordQuery(email, newOtp, password));
        forgotPasswordException(data)(INVALID_OTP_EXCEPTION, 'otp');
    });

    test('user not found', async () => {
        const session = new TestClient();
        const { password, email } = TestClient.createCredentials();
        const otp = getRandomInt(100000, 999999);
        const data = await session.query(forgetPasswordQuery(email, otp, password));
        forgotPasswordException(data)(USER_DOES_NOT_EXIST, null);
    });

    test('no credential found', async () => {
        const session = new TestClient();
        const { password } = TestClient.createCredentials();
        const { email, user } = await session.register();
        await session.query(sendForgetPasswordMailQuery(email));
        const otp = JSON.parse((await redis.get(`${REDIS_FORGOT_PASSWORD_PREFIX}:${user.id}`)) as string);
        const { forgotPassword } = await session.query(forgetPasswordQuery(email, otp, password));
        expect(forgotPassword.id).toEqual(user.id);
    });

    test('success', async () => {
        const session = new TestClient();
        const { password, email, name } = TestClient.createCredentials();
        const { register } = await session.query(registerWithPasswordQuery(email, password, name));
        await session.query(sendForgetPasswordMailQuery(email));
        const otp = JSON.parse((await redis.get(`${REDIS_FORGOT_PASSWORD_PREFIX}:${register.id}`)) as string);
        await session.query(forgetPasswordQuery(email, otp, password));
        await session.query(loginQuery(email, password));
        const me = await session.me();
        expect(me.id).toEqual(register.id);
    });
});
