import { IDone, IExceptions } from 'types';

import { ResolverMap } from 'types/graphql-utils';
import { Done, Exception } from 'utils/exceptionGenerator';
import { ValidationException } from 'apps/exceptions';
import { findUserByEmail } from 'apps/utils';
import { User } from 'apps/entities/User';
import { sendMailTask } from 'apps/tasks';
import { redis } from 'server/redis';
import { MAX_PASSWORD_RESET_TRY, REDIS_FORGOT_PASSWORD_PREFIX } from 'server/constants';
import { TestClient } from 'utils/testClient';

import { UserDoesNotExistException } from 'apps/auth/exceptions';

import { BasicAuth } from '../entities/BasicAuth';
import { generateForgotPasswordOTP, getBasicAuthUsingEmail } from '../utils';

import { forgotPasswordArgsValidator } from './validators';
import { resetOtpMaxLimitTask } from './tasks';

import { ResetFailedAttemptException, InvalidOTPException } from './exceptions';

const Resolvers: ResolverMap = {
    Mutation: {
        sendForgotPasswordMail: async (
            _,
            { email }: GQL.ISendForgotPasswordMailOnMutationArguments,
        ): Promise<IDone> => {
            const user = await findUserByEmail(email);
            if (user) {
                const otp = await generateForgotPasswordOTP(user.id);
                await sendMailTask.add({ body: `OTP is ${otp}`, email });
            }
            return Done();
        },

        forgotPassword: async (_, args: GQL.IForgotPasswordOnMutationArguments): Promise<IExceptions | User> => {
            const e = new Exception();

            try {
                await forgotPasswordArgsValidator.validate(args, { abortEarly: false });
            } catch (validationException) {
                e.add(ValidationException(validationException));
                return e.exception;
            }
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
                const redisOtp = await redis.get(`${REDIS_FORGOT_PASSWORD_PREFIX}:${user.id}`);
                const failed = auth.forgotPasswordFailed || 0;

                if (redisOtp && failed < MAX_PASSWORD_RESET_TRY)
                    if (otp === JSON.parse(redisOtp)) {
                        await auth.setPassword(password);
                        await auth.save();
                        await redis.del(`${REDIS_FORGOT_PASSWORD_PREFIX}:${user.id}`);
                        return user as User;
                    } else {
                        auth.forgotPasswordFailed = failed + 1;
                        if (!auth.password) {
                            const { password } = TestClient.createCredentials();
                            await auth.setPassword(password);
                        }
                        await auth.save();
                        if (failed === 4) await resetOtpMaxLimitTask.add({ email }, { delay: 1000 * 60 * 60 * 24 });
                        e.add(InvalidOTPException());
                    }
                else e.add(ResetFailedAttemptException());
            }

            return e.exception;
        },
    },
};

export default Resolvers;
