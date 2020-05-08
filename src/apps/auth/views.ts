import { Request, Response } from 'express';
import { redis } from 'server/redis';
import { REDIS_VERIFY_USER } from 'server/constants';
import { addHttp } from 'utils/funcs';

import { User } from '../entities/User';

export const VERIFY_USER_URL = '/auth/user/verify/:key';
export const verifyUser = async (request: Request, response: Response): Promise<any> => {
    const { key: id } = request.params;
    const key = `${REDIS_VERIFY_USER}:${id}`;
    const userId = await redis.get(key);
    const redirect = (request.query.redirect as string) || '';

    if (userId) {
        await User.update({ id: userId }, { verified: true });
        await redis.del(key);

        if (redirect === '')
            response.json({
                status: 'ok',
                message: 'Your email has been verified',
            });
        else response.redirect(addHttp(redirect));
    } else {
        response.status(400);
        response.json({
            status: 'error',
            message: 'The link is invalid, expired or used.',
        });
    }
};

export const urlPatterns = [[VERIFY_USER_URL, verifyUser]];
