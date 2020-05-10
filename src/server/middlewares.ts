import * as session from 'express-session';
import * as RateLimit from 'express-rate-limit';
import * as RateLimitRedisStore from 'rate-limit-redis';
import * as passport from 'passport';
import * as ConnectRedis from 'connect-redis';
import { createClient } from 'redis';

import { REDIS_SESSION_PREFIX, REDIS_URL } from './constants';

const Store = ConnectRedis(session);
const client = createClient(REDIS_URL);

const sessionMiddleware = session({
    name: 'clientid',
    store: new Store({ client, prefix: `${REDIS_SESSION_PREFIX}:` }),
    secret: process.env.SECRET_KEY || '*ib8529gv12+ci*2%c$q0vyhke2!i1stk(*uv@ol7dz+6ho*yk',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
});

// @ts-ignore
const rateLimit = new RateLimit({
    store: new RateLimitRedisStore({
        client,
    }),
    windowMs: 1 * 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 0 : 15,
    message: 'Too many request from this IP. Wait for some time to start again.',
});

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

export const middlewares: Array<any> = [sessionMiddleware, passport.initialize(), rateLimit];
