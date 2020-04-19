import * as session from 'express-session';
import { createClient } from 'redis';

import * as ConnectRedis from 'connect-redis';

import { REDIS_SESSION_PREFIX, REDIS_URL } from './constants';

const Store = ConnectRedis(session);
const client = createClient(REDIS_URL);

const sessionMiddleware = session({
    name: 'clientid',
    store: new Store({ client, prefix: REDIS_SESSION_PREFIX }),
    secret: process.env.SECRET_KEY || '*ib8529gv12+ci*2%c$q0vyhke2!i1stk(*uv@ol7dz+6ho*yk',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
});

export const middlewares: Array<any> = [sessionMiddleware];
