import { URL } from 'url';

import { Request, Response } from 'express';
import { redis } from 'server/redis';
import { REDIS_VERIFY_USER } from 'server/constants';
import { addHttp } from 'utils/funcs';

import { User } from '../entities/User';

export const VERIFY_USER_URL = '/auth/user/verify/:key';
export const verifyUser = async (request: Request, response: Response): Promise<any> => {
    let success = false;
    let message = '';

    const { key: id } = request.params;
    const redirect = request.query.redirect as string;

    const key = `${REDIS_VERIFY_USER}:${id}`;
    const email = await redis.get(key);

    if (email) {
        await redis.del(key);
        const { affected } = await User.update({ email }, { verified: true });
        if (affected && affected > 0) [success, message] = [true, 'Email successfully verified'];
        else message = 'No such email found';
    } else message = 'The link either expired or invalid';

    const url = new URL(addHttp(redirect));
    url.searchParams.append('email', email || '');
    url.searchParams.append('success', success.toString());
    url.searchParams.append('message', message);
    response.redirect(url.href);
};

export const urlPatterns = [[VERIFY_USER_URL, verifyUser]];
