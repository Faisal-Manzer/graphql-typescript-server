import { ResolverContext, ResolverMap } from 'types/graphql-utils';
import { User } from 'apps/entities/User';

import { loginUser, register } from './utils';
import { findUserByEmail } from '../utils';

const Resolvers: ResolverMap = {
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
    },
};

export default Resolvers;
