import { ResolverMap } from 'types/graphql-utils';

import { REDIS_SESSION_PREFIX } from 'server/constants';
import { redis } from 'server/redis';
import { destroySession } from 'apps/utils';

import { logOutOfAllSession } from 'apps/auth/utils';

const Resolvers: ResolverMap = {
    Mutation: {
        logout: async (_, { fromAll }: GQL.ILogoutOnMutationArguments, { session, user }): Promise<boolean> => {
            if (fromAll) await logOutOfAllSession(user.id);
            else await redis.del(`${REDIS_SESSION_PREFIX}${session.id}`);
            return await destroySession(session);
        },
    },
};

export default Resolvers;
