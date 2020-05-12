import { IExceptions } from 'types';
import { ResolverMap } from 'types/graphql-utils';
import { Exception } from 'utils/exceptionGenerator';

import { User } from 'apps/entities/User';
import { loginUser, lockAccount } from 'apps/auth/utils';
import { ACCOUNT_LOCKED_EXCEPTION } from 'apps/auth/exceptions';

import { checkCredentials } from '../utils';

const Resolvers: ResolverMap = {
    Mutation: {
        login: async (_, args: GQL.ILoginOnMutationArguments, { session }): Promise<User | IExceptions> => {
            const e = new Exception();

            try {
                const { email, password } = args;
                const user = (await checkCredentials(email, password)) as User;
                await loginUser(session, user);
                return user;
            } catch (exception) {
                e.add(exception);
                if (exception.code !== ACCOUNT_LOCKED_EXCEPTION) await lockAccount(args.email);
                return e.exception;
            }
        },
    },
};

export default Resolvers;
