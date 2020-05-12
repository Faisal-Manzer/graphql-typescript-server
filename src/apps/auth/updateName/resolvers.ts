import { ResolverMap } from 'types/graphql-utils';

import { IDone, IExceptions } from 'types';
import { Done, Exception } from 'utils/exceptionGenerator';

import { ValidationException } from 'apps/exceptions';
import { nameValidator } from 'apps/auth/validators';

const Resolvers: ResolverMap = {
    Mutation: {
        updateName: async (_, { name }: GQL.IUpdateNameOnMutationArguments, { user }): Promise<IDone | IExceptions> => {
            try {
                user.name = (await nameValidator.validate(name)) as string;
                await user.save();
                return Done();
            } catch (validationError) {
                return Exception.new(ValidationException(validationError));
            }
        },
    },
};

export default Resolvers;
