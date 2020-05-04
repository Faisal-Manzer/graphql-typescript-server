/**
 * @copyright Faisal Manzer 2020
 * @license MIT
 * https://github.com/Faisal-Manzer/graphql-typescript-server
 */

import { config as dotEnvConfig } from 'dotenv';
import { Server } from './server';
import { AddressInfo } from 'net';

dotEnvConfig();
const server = new Server({}, 4000);
server.start().then((app) => {
    const { port, address } = app.address() as AddressInfo;
    console.log(`Started server ${address} at http://localhost:${port}`);
});
