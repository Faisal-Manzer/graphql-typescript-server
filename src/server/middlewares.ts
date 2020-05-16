import * as session from 'express-session';
import * as RateLimit from 'express-rate-limit';
import * as RateLimitRedisStore from 'rate-limit-redis';
import * as SlowDown from 'express-slow-down';
import * as passport from 'passport';
import * as ConnectRedis from 'connect-redis';
import { createClient } from 'redis';
import { config as dotEnvConfig } from 'dotenv';
dotEnvConfig();

import {
    isProduction,
    isTest,
    MAX_SESSION_EXPIRY,
    REDIS_RATE_LIMIT,
    REDIS_SESSION_PREFIX,
    REDIS_SLOW_DOWN,
    REDIS_URL,
} from './constants';

const Store = ConnectRedis(session);
const client = createClient(REDIS_URL);

const sessionMiddleware = session({
    name: 'clientid',
    // @ts-ignore
    store: new Store({ client, prefix: `${REDIS_SESSION_PREFIX}:` }),
    secret: process.env.SECRET_KEY as string,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: isProduction,
        maxAge: MAX_SESSION_EXPIRY,
    },
});

// @ts-ignore
const rateLimit = new RateLimit({
    store: new RateLimitRedisStore({
        // @ts-ignore
        client,
        prefix: REDIS_RATE_LIMIT,
    }),
    windowMs: 15 * 60 * 1000,
    max: isTest ? 0 : 1000,
    message: 'Too many request from this IP. Wait for some time to start again.',
});

// @ts-ignore
const slowDown = new SlowDown({
    windowMs: 1 * 60 * 1000,
    delayAfter: 20,
    delayMs: isTest ? 0 : 500,
    store: new RateLimitRedisStore({
        // @ts-ignore
        client,
        prefix: REDIS_SLOW_DOWN,
    }),
});

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

export const middlewares: Array<any> = [sessionMiddleware, passport.initialize(), slowDown, rateLimit];
