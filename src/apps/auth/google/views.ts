import { Strategy } from 'passport-google-oauth20';
import * as passport from 'passport';

import { OAuth, OAuthAuthenticate, OAuthCallback } from '../oauth.utils';

OAuth(Strategy, {
    clientID: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    callbackURL: 'http://localhost:4000/auth/google/callback',
});

export const GOOGLE_OAUTH_URL = '/auth/google/';
const OAuthView = OAuthAuthenticate('google', { scope: ['profile', 'email'] });

export const GOOGLE_OAUTH_CALLBACK_URL = '/auth/google/callback/';
const authenticate = passport.authenticate('google');

export const urlPatterns = {
    get: [
        [GOOGLE_OAUTH_URL, OAuthView],
        [GOOGLE_OAUTH_CALLBACK_URL, authenticate, OAuthCallback],
    ],
};
