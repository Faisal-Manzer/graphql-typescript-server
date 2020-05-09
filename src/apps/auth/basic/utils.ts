import { BasicAuth } from './entities/BasicAuth';
import { User } from 'apps/entities/User';

import { UserDoesNotExistException } from '../exceptions';
import { InvalidCredentialsException, OldPasswordUsedException } from './exceptions';

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
