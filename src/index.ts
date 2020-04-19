/**
 * @copyright Faisal Manzer 2020
 * @license MIT
 * https://github.com/Faisal-Manzer/graphql-typescript-server
 */

import { config as enviromentConfig } from 'dotenv';
import { Server } from './server';

enviromentConfig();
const server = new Server({}, 4000);
server.start().then((app) => {
    const { port, address } = app.address();
    console.log(`Started server ${address} at http://localhost:${port}`);
});
