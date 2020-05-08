import { ResolverContext, ResolverMap } from 'types/graphql-utils';
import { User } from 'apps/entities/User';
import { REDIS_SESSION_PREFIX } from 'server/constants';
import { redis } from 'server/redis';
import { loginRequired, LoginRequiredExtra } from 'apps/decorators';
import { Done, Exception } from 'utils/exceptionGenerator';

import { createVerificationLink, findUserByEmail, loginUser, logOutOfAllSession, register } from './utils';
import { nameValidator } from './validators';

import { ValidationException } from '../exceptions';
import { IDone } from '../../types';
import { sendMailTask } from '../tasks';

export const Resolvers: ResolverMap = {
    UserOrExceptions: {
        __resolveType: (obj): string => (obj.exceptions ? 'Exceptions' : 'User'),
    },
    DoneOrExceptions: {
        __resolveType: (obj): string => (obj.exceptions ? 'Exceptions' : 'Done'),
    },
    Query: {
        me: loginRequired<User>({ checkVerified: false })(
            async (_: any, __: any, { session }: ResolverContext) => session.user,
        ),
    },
    Mutation: {
        /**
         * These are only for test and are insecure
         * please use env check here
         */

        testRegister: async (_, args: GQL.ITestRegisterOnMutationArguments): Promise<User | null> => {
            if (process.env.NODE_ENV === 'test') {
                const user = await register(args);
                if (args.verify) user.verified = true;
                await user.save();
                return user;
            }
            return null;
        },
        testLogin: async (_, args: any, { session }: ResolverContext): Promise<User | null> => {
            if (process.env.NODE_ENV === 'test') {
                const user = await findUserByEmail(args.email);
                if (user) {
                    await loginUser(session, user);
                    return user;
                }
            }
            return null;
        },
        testVerify: async (_, args: any): Promise<boolean> => {
            if (process.env.NODE_ENV === 'test') {
                const user = await findUserByEmail(args.email);
                if (user) {
                    user.verified = true;
                    await user.save();
                    return true;
                }

                return false;
            }
            return false;
        },

        /**
         * These will be used in production
         * make sure that all are secure
         */

        logout: async (_, { fromAll }: GQL.ILogoutOnMutationArguments, { session }): Promise<boolean> => {
            return new Promise(async (resolve) => {
                const destroySession: any = () => {
                    session.destroy((err: any) => {
                        if (err) return resolve(false);
                        return resolve(true);
                    });
                };

                const user = session.user as User;
                if (user) {
                    if (fromAll) await logOutOfAllSession(user.id);
                    else await redis.del(`${REDIS_SESSION_PREFIX}${session.id}`);
                }

                return destroySession();
            });
        },
        updateName: loginRequired<IDone>({ query: true })(
            async (_: any, { name }: any, __: any, ___: any, { user }: LoginRequiredExtra) => {
                try {
                    user.name = (await nameValidator.validate(name)) as string;
                    await user.save();
                    return Done();
                } catch (validationError) {
                    return Exception.new(ValidationException(validationError));
                }
            },
        ),
        sendConfMail: async (_, args: GQL.ISendConfMailOnMutationArguments, { host }): Promise<boolean> => {
            const { email, redirect } = args;
            const user = await findUserByEmail(email);
            if (user) {
                if (user.verified) return false;
                const link = await createVerificationLink(host, user.id, redirect);
                await sendMailTask.add({ email, body: link });
                return true;
            }

            return false;
        },
    },
};
