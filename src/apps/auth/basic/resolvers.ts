import { IDone, IExceptions } from 'types';

// @ts-ignore
import { test as isCommonPassword } from 'fxa-common-password-list';

import { ResolverContext, ResolverMap } from 'types/graphql-utils';
import { Done, Exception } from 'utils/exceptionGenerator';
import { ValidationException, UnknownException } from 'apps/exceptions';
import { User } from 'apps/entities/User';
import { loginRequired, LoginRequiredExtra } from 'apps/decorators';

import { findUserByEmail, loginUser, register } from '../utils';

import { InvalidCredentialsException, OldPasswordUsedException, PasswordGuessableException } from './exceptions';
import { BasicAuth } from './entities/BasicAuth';
import {
    changePasswordArgsValidator,
    registerWithPasswordArgsValidator,
    resetPasswordArgsValidator,
} from './validators';
import { checkCredentials, getBasicAuthUsingEmail } from './utils';
import { UserDoesNotExistException } from '../exceptions';

export const Resolvers: ResolverMap = {
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
                await registerWithPasswordArgsValidator.validate(args, { abortEarly: false });
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
        changePassword: loginRequired<IDone>()(
            async (
                _: any,
                { oldPassword, newPassword }: GQL.IChangePasswordOnMutationArguments,
                __: any,
                ___: any,
                { user }: LoginRequiredExtra,
            ) => {
                const e = new Exception();

                try {
                    await changePasswordArgsValidator.validate({ oldPassword, newPassword }, { abortEarly: false });
                } catch (validationException) {
                    e.add(ValidationException(validationException));
                }
                if (e.hasException) return e.exception;

                const credential = await getBasicAuthUsingEmail(user.email);
                if (credential) {
                    if (await credential.compare(oldPassword)) {
                        if (await credential.isOld(newPassword))
                            e.add(OldPasswordUsedException({ path: 'newPassword' }));
                        else {
                            await credential.setPassword(newPassword);
                            await credential.save();
                        }
                    } else if (await credential.isOld(oldPassword))
                        e.add(OldPasswordUsedException({ path: 'oldPassword' }));
                    else e.add(InvalidCredentialsException());
                } else if (!oldPassword) {
                    const u = await findUserByEmail(user.email);
                    if (u) {
                        const auth = new BasicAuth();
                        auth.user = u;
                        await auth.setPassword(newPassword);
                        await auth.save();
                    } else e.add(UserDoesNotExistException());
                } else e.add(UnknownException());

                if (e.hasException) return e.exception;
                return { done: true };
            },
        ),
    },
};
