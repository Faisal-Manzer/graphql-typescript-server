import { Session } from 'types';
import { User } from 'entity/User';
import { ValidationException } from 'modules/exceptions';
import { redis } from 'server/redis';
import { REDIS_USER_SESSION_PREFIX, REDIS_SESSION_PREFIX } from 'server/constants';

import { registerParmValidator } from './validators';
import { UserExistsException } from './exceptions';

type RegisterParams = {
    email: string;
    name: string;
};

export const findUserByEmail = async (email: string): Promise<User | undefined> => {
    return await User.findOne({ email: email.toLowerCase() });
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
        session.user = user;
        await redis.lpush(`${REDIS_USER_SESSION_PREFIX}:${user.id}`, session.id);
        return true;
    } catch (e) {
        return false;
    }
};

export const logOutOfAllSession = async (userId: string): Promise<void> => {
    const sessions = await redis.lrange(`${REDIS_USER_SESSION_PREFIX}:${userId}`, 0, -1);
    await Promise.all(sessions.map((sessionId: string) => redis.del(`${REDIS_SESSION_PREFIX}${sessionId}`)));
};
