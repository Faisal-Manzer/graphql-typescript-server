import { config as enviromentConfig } from 'dotenv';
import { Server } from '../../src/server';

enviromentConfig();
export const setup = async (): Promise<any> => {
    const server = new Server({}, 4001, 'test');
    const app = await server.start();
    const { port } = app.address();
    process.env.TEST_HOST = `http://127.0.0.1:${port}`;
};
