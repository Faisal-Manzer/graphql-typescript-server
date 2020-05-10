import { Strategy } from 'passport-linkedin-oauth2';
import * as passport from 'passport';

import { OAuth, OAuthAuthenticate, OAuthCallback } from '../oauth.utils';

OAuth(Strategy, {
    clientID: process.env.LINKEDIN_API_KEY as string,
    clientSecret: process.env.LINKEDIN_SECRET_KEY as string,
    callbackURL: 'http://localhost:4000/auth/linkedin/callback',
    scope: ['r_emailaddress', 'r_liteprofile'],
});

export const LINKEDIN_OAUTH_URL = '/auth/linkedin/';
const OAuthView = OAuthAuthenticate('linkedin');

export const LINKEDIN_OAUTH_CALLBACK_URL = '/auth/linkedin/callback/';
const authenticate = passport.authenticate('linkedin');

export const urlPatterns = {
    get: [
        [LINKEDIN_OAUTH_URL, OAuthView],
        [LINKEDIN_OAUTH_CALLBACK_URL, authenticate, OAuthCallback],
    ],
};
