import { Request, Response } from 'express';

import { redis } from 'server/redis';
import { REDIS_VERIFY_USER } from 'server/constants';

import { User } from 'apps/entities/User';
import { VERIFY_USER_URL } from 'apps/auth/constants';
import { createURL } from 'utils/funcs';

export const verifyUser = async (req: Request, res: Response): Promise<any> => {
    let success = false;
    let message = '';

    const { key: id } = req.params;
    const redirect = req.query.redirect as string;

    const key = `${REDIS_VERIFY_USER}:${id}`;
    const email = await redis.get(key);

    if (email) {
        await redis.del(key);
        const { affected } = await User.update({ email }, { verified: true });
        if (affected && affected > 0) [success, message] = [true, 'Email successfully verified'];
        else message = 'No such email found';
    } else message = 'The link either expired or invalid';

    res.redirect(
        createURL(redirect, {
            email: email || '',
            success,
            message,
        }),
    );
};

export default {
    get: [[VERIFY_USER_URL, verifyUser]],
};
