import { User } from 'entity/User';
import { ValidationException } from 'utils/exceptionGenerator';

import { emailValidator } from './validators';
import { UserExistsException } from './exceptions';

type RegisterParms = {
    email: string;
    name: string;
};

export const findUserByEmail = async (email: string): Promise<User | undefined> => {
    return await User.findOne({ email });
};

export const register = async (parms: RegisterParms): Promise<User> => {
    const { email, name } = parms;

    try {
        await emailValidator.validate({ email, name });
    } catch (errors) {
        throw ValidationException(errors);
    }

    const userExists = findUserByEmail(email);
    if (userExists) throw UserExistsException({ data: { email } });

    const user = User.create({ email, name });
    await user.save();

    return user;
};

export const login = async (): Promise<boolean> => {
    return false;
};
