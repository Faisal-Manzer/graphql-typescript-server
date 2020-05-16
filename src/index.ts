/**
 * @copyright Faisal Manzer 2020
 * @license MIT
 * https://github.com/Faisal-Manzer/graphql-typescript-server
 */

import { config as dotEnvConfig } from 'dotenv';
import { Server } from './server';
import { AddressInfo } from 'net';

dotEnvConfig();
const server = new Server({});
server.start().then((app) => {
    const { port } = app.address() as AddressInfo;
    console.log(`Started server at http://localhost:${port}`);
});
