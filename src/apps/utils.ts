import { User } from './entities/User';

export const findUserByEmail = async (email: string): Promise<User | undefined> => {
    return await User.findOne({ where: { email: email.toLowerCase() } });
};
