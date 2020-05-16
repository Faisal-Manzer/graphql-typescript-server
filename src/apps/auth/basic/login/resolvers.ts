import { IExceptions } from 'types';
import { ResolverMap } from 'types/graphql-utils';
import { Exception } from 'utils/exceptionGenerator';

import { User } from 'apps/entities/User';
import { loginUser, lockAccount } from 'apps/auth/utils';
import { ACCOUNT_LOCKED_EXCEPTION } from 'apps/auth/exceptions';
import { getJWT } from 'apps/auth/jwt.utils';

import { checkCredentials } from '../utils';

interface ILogin {
    user: User;
    token: string;
}
const Resolvers: ResolverMap = {
    LoginOrExceptions: {
        __resolveType: (obj): string => (obj.exceptions ? 'Exceptions' : 'Login'),
    },
    Mutation: {
        login: async (_, args: GQL.ILoginOnMutationArguments, { session }): Promise<ILogin | IExceptions> => {
            const e = new Exception();

            try {
                const { email, password } = args;
                const user = (await checkCredentials(email, password)) as User;
                const token = getJWT(user.id);
                await loginUser(session, user);
                return { user, token };
            } catch (exception) {
                e.add(exception);
                if (exception.code !== ACCOUNT_LOCKED_EXCEPTION) await lockAccount(args.email);
                return e.exception;
            }
        },
    },
};

export default Resolvers;
