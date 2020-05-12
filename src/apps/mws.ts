import { ResolverContext } from 'types/graphql-utils';
import { IExceptions } from 'types';
import { Exception } from 'utils/exceptionGenerator';

import { User } from './entities/User';
import { findUserByEmail } from './utils';
import { LoginRequiredException, UserNotVerifiedException } from './exceptions';

export const loginRequired = ({ exception = true, query = false, checkVerified = true } = {}) => async (
    resolve: Function,
    parent: any,
    args: any,
    context: ResolverContext,
    info: any,
): Promise<any> => {
    const returnError = (e = LoginRequiredException()): null | IExceptions => {
        if (exception) return Exception.new(e);
        return null;
    };

    let user: User | undefined = context.session.user;
    if (query) user = await findUserByEmail(user.email);
    if (!user) return returnError();
    if (checkVerified && !user.verified) return returnError(UserNotVerifiedException());
    return resolve(parent, args, { ...context, user }, info);
};
