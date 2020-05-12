import { Session } from 'types';
import { v4 as uuid } from 'uuid';

import { User } from 'apps/entities/User';
import { ValidationException } from 'apps/exceptions';
import { redis } from 'server/redis';
import { addHttp, getRedisKeyForValue } from 'utils/funcs';
import { REDIS_SESSION_PREFIX, REDIS_USER_SESSION_PREFIX, REDIS_VERIFY_USER } from 'server/constants';

import { findUserByEmail } from 'apps/utils';

import { registerParmValidator } from './validators';
import { UserExistsException } from './exceptions';
import { VERIFY_USER_URL } from './constants';
import { URL } from 'url';

export interface RegisterParams {
    email: string;
    name: string;
    redirectAfterVerification?: string;
}

export const register = async (params: RegisterParams): Promise<User> => {
    let { email, name } = params;

    try {
        const data = await registerParmValidator.validate({ email, name });
        email = data.email;
        name = data.name;
    } catch (errors) {
        throw ValidationException(errors);
    }

    const userExists = await findUserByEmail(email);
    if (userExists) throw [UserExistsException({ data: { email } })];

    const user = User.create({ email, name });
    await user.save();
    return user;
};

export const loginUser = async (session: Session, user: User): Promise<boolean> => {
    try {
        if (user.locked) return false;
        session.userId = user.id;
        if (user.failedAttempts > 0) {
            user.failedAttempts = 0;
            await user.save();
        }
        await redis.lpush(`${REDIS_USER_SESSION_PREFIX}:${user.id}`, session.id);
        return true;
    } catch (e) {
        return false;
    }
};

export const logOutOfAllSession = async (userId: string): Promise<void> => {
    const sessions = await redis.lrange(`${REDIS_USER_SESSION_PREFIX}:${userId}`, 0, -1);
    await Promise.all(sessions.map((sessionId: string) => redis.del(`${REDIS_SESSION_PREFIX}:${sessionId}`)));
};

export const getVerificationURL = (host: string, key: string, redirect: string): string =>
    `${host}${VERIFY_USER_URL.replace(':key', key)}?redirect=${encodeURI(redirect)}`;

export const createVerificationLink = async (host: string, email: string, redirect: string): Promise<string> => {
    const previousKey = await getRedisKeyForValue(REDIS_VERIFY_USER, email);
    if (previousKey) return getVerificationURL(host, previousKey, redirect);

    const key = uuid();
    await redis.set(`${REDIS_VERIFY_USER}:${key}`, email, 'ex', 60 * 15);
    return getVerificationURL(host, key, redirect);
};

export const findOrRegisterUser = async (email: string, name: string): Promise<User | null> => {
    const userInDB = await findUserByEmail(email);
    if (userInDB) return userInDB;
    else return await register({ email, name });
};

export const lockingTime = {
    '5': 1000 * 30,
    '10': 1000 * 60 * 10,
    '14': 1000 * 60 * 15,
    '17': 1000 * 60 * 30,
    '19': 1000 * 60 * 60,
    '20': 1000 * 60 * 24,
};

export const lockAccount = async (email: string): Promise<void> => {
    const user = await findUserByEmail(email);
    if (user) {
        if (!user.locked) {
            let failedAttempts = user.failedAttempts + 1;

            if (lockingTime.hasOwnProperty(`${failedAttempts}`)) {
                console.log('LOCKING ACCOUNT');
                user.locked = true;

                const { unLockAccountTask } = await require('./tasks');
                await unLockAccountTask.add(
                    { email: user.email },
                    // @ts-ignore
                    { delay: lockingTime[`${failedAttempts}`] },
                );
                if (failedAttempts === 17) failedAttempts = 0;
            }

            user.failedAttempts = failedAttempts;
            await user.save();
        }
    }
};

export const redirectUrl = (redirect: string, email: string | null, success: boolean, message: string): string => {
    const url = new URL(addHttp(redirect));
    url.searchParams.append('email', email || '');
    url.searchParams.append('success', success.toString());
    url.searchParams.append('message', message);
    return url.href;
};
