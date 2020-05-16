import { Response } from 'express';
import * as passport from 'passport';

import { Request } from 'types';
import { createURL } from 'utils/funcs';

import { findOrRegisterUser, RegisterParams } from './utils';
import { getJWT } from './jwt.utils';

import { User } from '../entities/User';

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
    const user = req.user as User | undefined;
    if (user) {
        success = true;
        req.session.userId = user.id;
        email = (req.user as User).email;
    }

    if (redirect)
        res.redirect(
            createURL(redirect, {
                email,
                success,
                message: !success ? req.session.err : 'Login success',
                token: getJWT(user?.id as string),
            }),
        );
    else {
        if (success) res.send(`Welcome ${user?.name}`);
        else res.send('Login failed');
    }
};

interface IOAuthView {
    name: string;
    strategy: any;
    options: any;
    getUser?: Function;
    viewOptions?: any;
    callbackOptions?: any;
}

export const OAuthViews = ({
    name,
    strategy,
    options,
    getUser = defaultGetUserCredentials,
    viewOptions = {},
    callbackOptions = {},
}: IOAuthView): Array<any> => {
    OAuth(strategy, options, getUser);

    const view = OAuthAuthenticate(name, viewOptions);
    const callback = passport.authenticate(name, { session: false, ...callbackOptions });
    const viewURL = `/auth/${name}/`;
    const callbackURL = `/auth/${name}/callback/`;

    return [
        [viewURL, view],
        [callbackURL, callback, OAuthCallback],
    ];
};
