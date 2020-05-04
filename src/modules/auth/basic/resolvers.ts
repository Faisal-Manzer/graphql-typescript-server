import { IExceptions } from 'types';

// @ts-ignore
import { test as isCommonPassword } from 'fxa-common-password-list';

import { ResolverContext, ResolverMap } from 'types/graphql-utils';
import { Exception } from 'utils/exceptionGenerator';
import { ValidationException, UnknownException } from 'modules/exceptions';
import { User } from 'entity/User';

import { loginUser, register } from '../utils';

import { PasswordGuessableException } from './exceptions';
import { BasicAuth } from './entity/BasicAuth';
import { registerWithPasswordArgumentsValidator } from './validators';
import { checkCredentials } from './utils';

export const Resolvers: ResolverMap = {
    UserOrExceptions: {
        __resolveType: (obj): string => (obj.exceptions ? 'Exceptions' : 'User'),
    },
    Mutation: {
        registerWithPassword: async (
            _,
            args: GQL.IRegisterWithPasswordOnMutationArguments,
        ): Promise<User | IExceptions> => {
            const e = new Exception();
            const { email, password, name } = args;

            if (isCommonPassword(password)) e.add(PasswordGuessableException({}));
            if (password === email) e.add(PasswordGuessableException({}));

            try {
                await registerWithPasswordArgumentsValidator.validate(args, { abortEarly: false });
            } catch (validationException) {
                e.add(ValidationException(validationException));
            }

            if (e.hasException) return e.exception;

            try {
                const user = await register({ email, name });

                const basicAuth = new BasicAuth();
                basicAuth.user = user;
                await basicAuth.setPassword(password);
                await basicAuth.save();

                return user;
            } catch (exceptions) {
                if (Array.isArray(exceptions)) e.add(exceptions);
                else e.add(UnknownException({}));
            }

            return e.exception;
        },

        loginWithPassword: async (
            _,
            args: GQL.ILoginWithPasswordOnMutationArguments,
            { session }: ResolverContext,
        ): Promise<User | IExceptions> => {
            const e = new Exception();
            let user;
            const { email, password } = args;

            try {
                user = (await checkCredentials(email, password)) as User;
            } catch (exception) {
                e.add(exception);
            }
            if (e.hasException) return e.exception;

            if (user) {
                await loginUser(session, user);
                return user;
            }

            e.add(UnknownException());
            return e.exception;
        },
    },
};
