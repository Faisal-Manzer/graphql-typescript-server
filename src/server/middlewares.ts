import * as session from 'express-session';
import * as RateLimit from 'express-rate-limit';
import * as RateLimitRedisStore from 'rate-limit-redis';
import * as SlowDown from 'express-slow-down';
import * as passport from 'passport';
import * as ConnectRedis from 'connect-redis';
import { createClient } from 'redis';

import { REDIS_RATE_LIMIT, REDIS_SESSION_PREFIX, REDIS_SLOW_DOWN, REDIS_URL } from './constants';

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
        prefix: REDIS_RATE_LIMIT,
    }),
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 0 : 1000,
    message: 'Too many request from this IP. Wait for some time to start again.',
});

// @ts-ignore
const slowDown = new SlowDown({
    windowMs: 1 * 60 * 1000,
    delayAfter: 20,
    delayMs: process.env.NODE_ENV === 'test' ? 0 : 500,
    store: new RateLimitRedisStore({
        client,
        prefix: REDIS_SLOW_DOWN,
    }),
});

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

export const middlewares: Array<any> = [sessionMiddleware, passport.initialize(), slowDown, rateLimit];
