import { IDone, IExceptions } from 'types';

import { ResolverMap } from 'types/graphql-utils';
import { Done, Exception } from 'utils/exceptionGenerator';
import { ValidationException, UnknownException } from 'apps/exceptions';

import { BasicAuth } from '../entities/BasicAuth';
import { InvalidCredentialsException, OldPasswordUsedException } from '../exceptions';
import { getBasicAuthUsingEmail } from '../utils';

import { changePasswordArgsValidator } from './validators';

const Resolvers: ResolverMap = {
    Mutation: {
        changePassword: async (
            _,
            args: GQL.IChangePasswordOnMutationArguments,
            { user },
        ): Promise<IDone | IExceptions> => {
            const e = new Exception();

            try {
                await changePasswordArgsValidator.validate(args, { abortEarly: false });
            } catch (validationException) {
                e.add(ValidationException(validationException));
                return e.exception;
            }

            const { oldPassword, newPassword } = args;

            const credential = await getBasicAuthUsingEmail(user.email);
            if (credential && oldPassword) {
                if (await credential.verifyPassword(oldPassword)) {
                    await credential.setPassword(newPassword);
                    await credential.save();
                } else if (await credential.isOld(oldPassword))
                    e.add(OldPasswordUsedException({ path: 'oldPassword' }));
                else e.add(InvalidCredentialsException());
            } else if (!oldPassword) {
                const auth = new BasicAuth();
                auth.user = user;
                await auth.setPassword(newPassword);
                await auth.save();
            } else e.add(UnknownException());

            if (e.hasException) return e.exception;
            return Done();
        },
    },
};

export default Resolvers;
