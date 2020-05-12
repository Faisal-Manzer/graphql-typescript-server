import { Response } from 'express';
import * as passport from 'passport';

import { Request } from 'types';

import { findOrRegisterUser, redirectUrl, RegisterParams } from './utils';

const defaultGetUserCredentials = (profile: any): RegisterParams => ({
    email: profile.emails[0].value,
    name: profile.displayName,
});
export const OAuth = (strategy: any, options: any, getUserCredentials: Function = defaultGetUserCredentials): void => {
    passport.use(
        new strategy(options, async function (
            accessToken: string,
            refreshToken: string,
            profile: any,
            done: Function,
        ): Promise<any> {
            const { name, email } = getUserCredentials(profile);
            const user = await findOrRegisterUser(email, name);
            done(undefined, user);
        }),
    );
};

export const OAuthAuthenticate = (strategy: string, options: any = {}) => (
    req: Request,
    res: Response,
    next: Function,
): void => {
    req.session.redirect = req.query.redirect;
    passport.authenticate(strategy, options)(req, res, next);
};

export const OAuthCallback = (req: Request, res: Response): void => {
    let success = false;
    const redirect = req.session.redirect;
    delete req.session.redirect;

    let email = '';
    if (req.session.passport.user) {
        success = true;
        req.session.user = req.session.passport.user;
        delete req.session.passport;
        email = req.session.user.email;
    }

    if (redirect) res.redirect(redirectUrl(redirect, email, success, !success ? req.session.err : 'Login success'));
    else {
        if (success) res.send(`Welcome ${req.session.user.name}`);
        else res.send('Login failed');
    }
};
