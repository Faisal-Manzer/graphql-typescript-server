import { ResolverMap } from 'types/graphql-utils';

const Resolvers: ResolverMap = {
    Query: {
        ping: (): string => 'pong',
    },
};

export default Resolvers;
