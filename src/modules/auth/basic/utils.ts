import { BasicAuth } from './entity/BasicAuth';
import { User } from 'entity/User';

import { UserDoesNotExistException } from '../exceptions';
import { InvalidCredentialsException, OldPasswordUsedException } from './exceptions';

export const checkCredentials = async (email: string, password: string): Promise<User> => {
    // const auth = await BasicAuth.findOne({ where: { user: { email } } });
    const auth = await BasicAuth.createQueryBuilder('auth')
        .leftJoinAndSelect('auth.user', 'user')
        .where('user.email = :email', { email })
        .getOne();

    if (!auth) throw UserDoesNotExistException();
    if (await auth.compare(password)) return auth.user;
    else if (await auth.isOld(password)) throw OldPasswordUsedException();
    else throw InvalidCredentialsException();
};
