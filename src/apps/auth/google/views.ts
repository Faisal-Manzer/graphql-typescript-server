import { Strategy } from 'passport-google-oauth20';
import { OAuthViews } from 'apps/auth/oauth.utils';

let views: any[] = [];

if (process.env.GOOGLE_CLIENT_ID)
    views = OAuthViews({
        name: 'google',
        strategy: Strategy,
        options: {
            clientID: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            callbackURL: 'http://localhost:4000/auth/google/callback',
            scope: ['profile', 'email'],
        },
    });

export default {
    get: views,
};
