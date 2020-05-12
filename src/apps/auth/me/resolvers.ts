import { ResolverMap } from 'types/graphql-utils';
import { User } from 'apps/entities/User';

const Resolvers: ResolverMap = {
    Query: {
        me: async (_, __, { user }): Promise<User> => user,
    },
};

export default Resolvers;
