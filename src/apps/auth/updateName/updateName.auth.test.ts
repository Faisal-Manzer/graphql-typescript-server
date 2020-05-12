import { Connection } from 'typeorm';

import { dbConnect } from 'server/db';
import { LOGIN_REQUIRED_EXCEPTION, USER_NOT_VERIFIED, VALIDATION_EXCEPTION } from 'apps/exceptions';
import { TestClient } from 'utils/testClient';

let conn: Connection;

beforeAll(async () => {
    conn = await dbConnect();
});

afterAll(async () => {
    await conn.close();
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
