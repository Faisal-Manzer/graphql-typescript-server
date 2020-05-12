import { Strategy } from 'passport-google-oauth20';
import * as passport from 'passport';

import { OAuth, OAuthAuthenticate, OAuthCallback } from 'apps/auth/oauth.utils';

let views: any[] = [];

export const GOOGLE_OAUTH_URL = '/auth/google/';
export const GOOGLE_OAUTH_CALLBACK_URL = '/auth/google/callback/';

if (process.env.GOOGLE_CLIENT_ID) {
    OAuth(Strategy, {
        clientID: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        callbackURL: 'http://localhost:4000/auth/google/callback',
    });

    const OAuthView = OAuthAuthenticate('google', { scope: ['profile', 'email'] });

    const authenticate = passport.authenticate('google');

    views = [
        [GOOGLE_OAUTH_URL, OAuthView],
        [GOOGLE_OAUTH_CALLBACK_URL, authenticate, OAuthCallback],
    ];
}
export default {
    get: views,
};
