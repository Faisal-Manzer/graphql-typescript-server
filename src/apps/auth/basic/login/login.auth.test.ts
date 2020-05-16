import { TestClient } from 'utils/testClient';
import { INVALID_CREDENTIALS_EXCEPTION } from '../exceptions';
import { USER_DOES_NOT_EXIST } from 'apps/auth/exceptions';

import { loginQuery, loginException, registerQuery } from 'apps/auth/basic/testUtils';
import * as jwt from 'jsonwebtoken';

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
        const { register } = await session.query(registerQuery(email, password, name));

        const { login } = await session.query(loginQuery(email, password));
        expect(login?.user?.id).toEqual(register.id);

        const me = await session.me();
        expect(me?.id).toEqual(register.id);
    });
});

describe('jwt', () => {
    test('jwt wrong token', async (): Promise<void> => {
        const { email, name, password } = TestClient.createCredentials();
        const session = new TestClient();
        const { register } = await session.query(registerQuery(email, password, name));

        const wrongToken = jwt.sign({ id: register.id }, 'wrong-secret', {
            expiresIn: 60 * 60 * 24 * 7, // 7 days
        });

        try {
            jwt.verify(wrongToken, process.env.SECRET_KEY as string);
            expect(true).toEqual(false);
        } catch (e) {
            expect(e.name).toEqual('JsonWebTokenError');
        }
    });

    test('jwt verify', async (): Promise<void> => {
        const { email, name, password } = TestClient.createCredentials();
        const session = new TestClient();
        const { register } = await session.query(registerQuery(email, password, name));

        const { login } = await session.query(loginQuery(email, password));
        const { payload } = jwt.verify(login.token, process.env.SECRET_KEY as string, { complete: true }) as any;
        expect(payload.id).toEqual(register.id);
    });
});
