import { User } from './entities/User';
import { Session } from 'types';

export const findUserByEmail = async (email: string | undefined | null): Promise<User | undefined> => {
    if (!email) return undefined;
    return await User.findOne({ where: { email: email.toLowerCase() } });
};

export const findUserById = async (userId: string | null | undefined): Promise<User | undefined> => {
    if (!userId) return undefined;
    return await User.findOne(userId);
};

export const destroySession = (session: Session): Promise<boolean> =>
    new Promise(async (resolve) => {
        session.destroy((err: any) => {
            if (err) return resolve(false);
            return resolve(true);
        });
    });
