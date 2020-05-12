import { ResolverMap } from 'types/graphql-utils';
import { User } from 'apps/entities/User';

import { findUserByEmail } from 'apps/utils';

import { loginUser, register } from '../utils';

const Resolvers: ResolverMap = {
    Mutation: {
        /**
         * These are only for test and are insecure
         * please use env check here
         */
        testRegister: async (_, args: any): Promise<User | null> => {
            const user = await register(args);
            if (args.verify) user.verified = true;
            await user.save();
            return user;
        },
        testLogin: async (_, args: any, { session }): Promise<User | null> => {
            const user = await findUserByEmail(args.email);
            if (user) {
                await loginUser(session, user);
                return user;
            }
            return null;
        },
        testVerify: async (_, args: any): Promise<boolean> => {
            const user = await findUserByEmail(args.email);
            if (user) {
                user.verified = true;
                await user.save();
                return true;
            }

            return false;
        },
    },
};

export default Resolvers;
