import { IDone, IExceptions } from 'types';

// @ts-ignore
import { test as isCommonPassword } from 'fxa-common-password-list';

import { ResolverContext, ResolverMap } from 'types/graphql-utils';
import { Done, Exception } from 'utils/exceptionGenerator';
import { ValidationException, UnknownException } from 'apps/exceptions';
import { User } from 'apps/entities/User';
import { loginRequired, LoginRequiredExtra } from 'apps/decorators';
import { RecaptchaNotValidException, UserDoesNotExistException } from '../exceptions';
import { sendMailTask } from 'apps/tasks';
import { redis } from 'server/redis';
import { REDIS_FORGOT_PASSWORD_PREFIX } from 'server/constants';

import { findUserByEmail, loginUser, register } from '../utils';
import { googleRecaptchaValidator } from '../recaptcha';

import {
    InvalidCredentialsException,
    InvalidOTPException,
    OldPasswordUsedException,
    PasswordGuessableException,
} from './exceptions';
import { BasicAuth } from './entities/BasicAuth';
import {
    changePasswordArgsValidator,
    registerWithPasswordArgsValidator,
    forgotPasswordArgsValidator,
} from './validators';
import { checkCredentials, generateForgotPasswordOTP, getBasicAuthUsingEmail } from './utils';

export const Resolvers: ResolverMap = {
    Mutation: {
        registerWithPassword: async (
            _,
            args: GQL.IRegisterWithPasswordOnMutationArguments,
            { ip }: ResolverContext,
        ): Promise<User | IExceptions> => {
            const e = new Exception();
            const { email, password, name } = args;

            if (!(await googleRecaptchaValidator(args?.captcha, ip)))
                return Exception.new(RecaptchaNotValidException());

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
                if (credential && oldPassword) {
                    if (await credential.verifyPassword(oldPassword)) {
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
                return Done();
            },
        ),
        sendForgotPasswordMail: async (
            _,
            { email }: GQL.ISendForgotPasswordMailOnMutationArguments,
        ): Promise<IDone> => {
            const user = await findUserByEmail(email);
            if (user) {
                const otp = await generateForgotPasswordOTP(user.id);
                await sendMailTask.add({
                    body: `OTP is ${otp}`,
                    email,
                });
            }
            return Done();
        },
        forgotPassword: async (_, args: GQL.IForgotPasswordOnMutationArguments): Promise<IExceptions | User> => {
            const e = new Exception();

            try {
                await forgotPasswordArgsValidator.validate(args, { abortEarly: false });
            } catch (validationException) {
                e.add(ValidationException(validationException));
            }
            if (e.hasException) return e.exception;

            const { email, password, otp } = args;
            let user;
            let auth;

            auth = await getBasicAuthUsingEmail(email);
            if (auth) {
                user = auth.user;
            } else {
                user = await findUserByEmail(email);
                if (user) auth = new BasicAuth();
                else e.add(UserDoesNotExistException());
            }

            if (auth && user) {
                const redisOtp = (await redis.get(`${REDIS_FORGOT_PASSWORD_PREFIX}:${user.id}`)) || '';
                if (otp === JSON.parse(redisOtp)) {
                    await auth.setPassword(password);
                    await auth.save();
                    return user as User;
                } else e.add(InvalidOTPException());
            }

            return e.exception;
        },
    },
};
