import { TestClient } from 'utils/testClient';
import { INVALID_CREDENTIALS_EXCEPTION } from '../exceptions';
import { USER_DOES_NOT_EXIST } from 'apps/auth/exceptions';

import { loginQuery, loginException, registerQuery } from 'apps/auth/basic/testUtils';

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
        expect(login?.id).toEqual(register.id);

        const me = await session.me();
        expect(me?.id).toEqual(register.id);
    });
});
