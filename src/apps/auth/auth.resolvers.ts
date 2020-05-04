import { ResolverContext, ResolverMap } from 'types/graphql-utils';
import { User } from 'apps/entities/User';
import { REDIS_SESSION_PREFIX } from 'server/constants';
import { redis } from 'server/redis';

import { findUserByEmail, loginUser, logOutOfAllSession, register } from './auth.utils';

export const Resolvers: ResolverMap = {
    UserOrExceptions: {
        __resolveType: (obj): string => (obj.exceptions ? 'Exceptions' : 'User'),
    },
    Query: {
        me: async (_, __, { session }: ResolverContext): Promise<User | null> => {
            if (session.user) return session.user;
            return null;
        },
    },
    Mutation: {
        testRegister: async (_, args: any): Promise<User | null> => {
            if (process.env.NODE_ENV === 'test') return await register(args);
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
    },
};
