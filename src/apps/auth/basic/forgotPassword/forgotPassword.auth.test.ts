import { Connection } from 'typeorm';

import { dbConnect } from 'server/db';
import { TestClient } from 'utils/testClient';
import { getRandomInt } from 'utils/funcs';
import { REDIS_FORGOT_PASSWORD_PREFIX } from 'server/constants';
import { redis } from 'server/redis';

import { USER_DOES_NOT_EXIST } from 'apps/auth/exceptions';

import { INVALID_OTP_EXCEPTION } from './exceptions';
import { registerQuery, loginQuery } from '../testUtils';

let conn: Connection;

beforeAll(async () => {
    conn = await dbConnect();
});

afterAll(async () => {
    await conn.close();
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
        const { register } = await session.query(registerQuery(email, password, name));
        await session.query(sendForgetPasswordMailQuery(email));
        const otp = JSON.parse((await redis.get(`${REDIS_FORGOT_PASSWORD_PREFIX}:${register.id}`)) as string);
        await session.query(forgetPasswordQuery(email, otp, password));
        await session.query(loginQuery(email, password));
        const me = await session.me();
        expect(me.id).toEqual(register.id);
    });
});
