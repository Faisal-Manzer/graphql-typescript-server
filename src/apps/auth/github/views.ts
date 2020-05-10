import { Strategy } from 'passport-github2';
import * as passport from 'passport';

import { OAuth, OAuthAuthenticate, OAuthCallback } from '../oauth.utils';

let views: any[] = [];

export const GITHUB_OAUTH_URL = '/auth/github/';
export const GITHUB_OAUTH_CALLBACK_URL = '/auth/github/callback/';

if (process.env.GITHUB_CLIENT_ID) {
    OAuth(Strategy, {
        clientID: process.env.GITHUB_CLIENT_ID as string,
        clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        callbackURL: 'http://localhost:4000/auth/github/callback',
    });

    const OAuthView = OAuthAuthenticate('github', { scope: ['user:email'] });

    const authenticate = passport.authenticate('github');

    views = [
        [GITHUB_OAUTH_URL, OAuthView],
        [GITHUB_OAUTH_CALLBACK_URL, authenticate, OAuthCallback],
    ];
}

export const urlPatterns = {
    get: views,
};
