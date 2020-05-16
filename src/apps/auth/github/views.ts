import { Strategy } from 'passport-github2';
import { OAuthViews } from 'apps/auth/oauth.utils';

let views: any[] = [];

if (process.env.GOOGLE_RECAPTCHA_SECRET)
    views = OAuthViews({
        name: 'github',
        strategy: Strategy,
        options: {
            clientID: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
            callbackURL: 'http://localhost:4000/auth/github/callback',
        },
    });

export default {
    get: views,
};
