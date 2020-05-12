import { ResolverContext, ResolverMap } from 'types/graphql-utils';
import { User } from 'apps/entities/User';
import { REDIS_SESSION_PREFIX } from 'server/constants';
import { redis } from 'server/redis';
import { loginRequired, LoginRequiredExtra } from 'apps/decorators';
import { Done, Exception } from 'utils/exceptionGenerator';

import { createVerificationLink, loginUser, logOutOfAllSession, register } from './utils';
import { nameValidator, sendConfMailParmValidator } from './validators';

import { ValidationException } from '../exceptions';
import { IDone, IExceptions } from '../../types';
import { sendMailTask } from '../tasks';

const Resolvers: ResolverMap = {
    UserOrExceptions: {
        __resolveType: (obj): string => (obj.exceptions ? 'Exceptions' : 'User'),
    },
    DoneOrExceptions: {
        __resolveType: (obj): string => (obj.exceptions ? 'Exceptions' : 'Done'),
    },
    Query: {
        me: async (_: any, __: any, { user }: any): Promise<User> => user,
    },
    Mutation: {
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
        updateName: async (_: any, { name }: any, { user }: any, ___: any): Promise<IDone | IExceptions> => {
            try {
                user.name = (await nameValidator.validate(name)) as string;
                await user.save();
                return Done();
            } catch (validationError) {
                return Exception.new(ValidationException(validationError));
            }
        },
        sendVerificationEmail: async (_, args: GQL.ISendConfMailOnMutationArguments, { host }): Promise<boolean> => {
            const { redirect } = args;
            let email = '';

            try {
                const data = await sendConfMailParmValidator.validate(args);
                email = data.email;
            } catch (e) {
                return false;
            }

            const link = await createVerificationLink(host, email, redirect);
            await sendMailTask.add({ email, body: link });
            return true;
        },
    },
};

export default Resolvers;
