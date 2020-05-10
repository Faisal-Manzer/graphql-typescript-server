import { Strategy } from 'passport-github2';
import * as passport from 'passport';

import { OAuth, OAuthAuthenticate, OAuthCallback } from '../oauth.utils';

OAuth(Strategy, {
    clientID: process.env.GITHUB_CLIENT_ID as string,
    clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    callbackURL: 'http://localhost:4000/auth/github/callback',
});

export const GITHUB_OAUTH_URL = '/auth/github/';
const OAuthView = OAuthAuthenticate('github', { scope: ['user:email'] });

export const GITHUB_OAUTH_CALLBACK_URL = '/auth/github/callback/';
const authenticate = passport.authenticate('github');

export const urlPatterns = {
    get: [
        [GITHUB_OAUTH_URL, OAuthView],
        [GITHUB_OAUTH_CALLBACK_URL, authenticate, OAuthCallback],
    ],
};
