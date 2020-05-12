import { ResolverMap } from 'types/graphql-utils';
import { User } from 'apps/entities/User';
import { Done } from 'utils/exceptionGenerator';

const Resolvers: ResolverMap = {
    UserOrExceptions: {
        __resolveType: (obj): string => (obj.exceptions ? 'Exceptions' : 'User'),
    },
    DoneOrExceptions: {
        __resolveType: (obj): string => (obj.exceptions ? 'Exceptions' : 'Done'),
    },
};

export default Resolvers;
