import { User } from 'apps/entities/User';
import { redis } from 'server/redis';
import { REDIS_FORGOT_PASSWORD_PREFIX } from 'server/constants';
import { getRandomInt } from 'utils/funcs';

import { UserDoesNotExistException } from '../exceptions';

import { InvalidCredentialsException, OldPasswordUsedException } from './exceptions';
import { BasicAuth } from './entities/BasicAuth';

export const getBasicAuthUsingEmail = async (email: string): Promise<BasicAuth | undefined> => {
    return await BasicAuth.createQueryBuilder('auth')
        .leftJoinAndSelect('auth.user', 'user')
        .where('user.email = :email', { email })
        .getOne();
};

export const checkCredentials = async (email: string, password: string): Promise<User> => {
    const auth = await getBasicAuthUsingEmail(email);

    if (!auth) throw UserDoesNotExistException();
    if (await auth.compare(password)) return auth.user;
    else if (await auth.isOld(password)) throw OldPasswordUsedException();
    else throw InvalidCredentialsException();
};

export const generateForgotPasswordOTP = async (userId: string): Promise<number> => {
    const otp = getRandomInt(10000, 999999);
    const previousKey = await redis.get(`${REDIS_FORGOT_PASSWORD_PREFIX}:${userId}`);
    if (previousKey) return JSON.parse(previousKey);

    await redis.set(`${REDIS_FORGOT_PASSWORD_PREFIX}:${userId}`, JSON.stringify(otp), 'ex', 60 * 15);
    return otp;
};
