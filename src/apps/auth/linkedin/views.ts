import { Strategy } from 'passport-linkedin-oauth2';
import * as passport from 'passport';

import { OAuth, OAuthAuthenticate, OAuthCallback } from '../oauth.utils';

let views: any[] = [];

export const LINKEDIN_OAUTH_URL = '/auth/linkedin/';
export const LINKEDIN_OAUTH_CALLBACK_URL = '/auth/linkedin/callback/';

if (process.env.LINKEDIN_API_KEY) {
    OAuth(Strategy, {
        clientID: process.env.LINKEDIN_API_KEY as string,
        clientSecret: process.env.LINKEDIN_SECRET_KEY as string,
        callbackURL: 'http://localhost:4000/auth/linkedin/callback',
        scope: ['r_emailaddress', 'r_liteprofile'],
    });

    const OAuthView = OAuthAuthenticate('linkedin');
    const authenticate = passport.authenticate('linkedin');

    views = [
        [LINKEDIN_OAUTH_URL, OAuthView],
        [LINKEDIN_OAUTH_CALLBACK_URL, authenticate, OAuthCallback],
    ];
}
export default {
    get: views,
};
