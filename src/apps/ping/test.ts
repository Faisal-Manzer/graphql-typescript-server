import { TestClient } from 'utils/testClient';

const pingQuery = (): string => `
    query {
        ping
    }
`;

describe('ping', () => {
    test('ping', async () => {
        const session = new TestClient();
        const response = await session.query(pingQuery());
        expect(response.ping).toEqual('pong');
    });
});
