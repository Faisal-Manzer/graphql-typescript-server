import { Session } from 'types';
import { v4 as uuid } from 'uuid';

import { User } from 'apps/entities/User';
import { ValidationException } from 'apps/exceptions';
import { redis } from 'server/redis';
import { getRedisKeyForValue } from 'utils/funcs';
import { REDIS_USER_SESSION_PREFIX, REDIS_SESSION_PREFIX, REDIS_VERIFY_USER } from 'server/constants';

import { registerParmValidator } from './validators';
import { UserExistsException } from './exceptions';
import { VERIFY_USER_URL } from './views';

type RegisterParams = {
    email: string;
    name: string;
    redirectAfterVerification?: string;
};

export const findUserByEmail = async (email: string): Promise<User | undefined> => {
    return await User.findOne({ where: { email: email.toLowerCase() } });
};

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
        session.user = user;
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
