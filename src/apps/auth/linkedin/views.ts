import { Strategy } from 'passport-linkedin-oauth2';
import { OAuthViews } from 'apps/auth/oauth.utils';

let views: any[] = [];

if (process.env.LINKEDIN_API_KEY)
    views = OAuthViews({
        name: 'linkedin',
        strategy: Strategy,
        options: {
            clientID: process.env.LINKEDIN_API_KEY as string,
            clientSecret: process.env.LINKEDIN_SECRET_KEY as string,
            callbackURL: 'http://localhost:4000/auth/linkedin/callback',
            scope: ['r_emailaddress', 'r_liteprofile'],
        },
    });

export default {
    get: views,
};
