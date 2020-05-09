import { ResolverContext, Resolver } from 'types/graphql-utils';
import { Exception } from '../utils/exceptionGenerator';
import { IExceptions } from '../types';
import { LOGIN_REQUIRED_EXCEPTION, LoginRequiredException } from './exceptions';
import { findUserByEmail } from './auth/utils';
import { User } from './entities/User';
import { USER_NOT_VERIFIED, UserNotVerifiedException } from './auth/exceptions';

export interface LoginRequiredExtra {
    user: User;
}
export function loginRequired<ReturnType>({
    error = false,
    exception = true,
    query = false,
    checkVerified = true,
} = {}): Function {
    return function (func: Resolver) {
        return async function (
            parent: any,
            args: { [key: string]: any },
            context: ResolverContext,
            info: any,
        ): Promise<ReturnType | null | IExceptions> {
            const { session } = context;
            const returnError = ({
                errorMessage = 'User must login to use this function',
                exceptionMessage = LoginRequiredException(),
            }): null | IExceptions => {
                if (error) throw new Error(errorMessage);
                if (exception) return Exception.new(exceptionMessage);
                return null;
            };

            if (session.user) {
                let extra = { user: session.user };
                if (query) {
                    const user = await findUserByEmail(session.user.email);
                    if (checkVerified) {
                        if (!user?.verified)
                            return returnError({
                                errorMessage: USER_NOT_VERIFIED,
                                exceptionMessage: UserNotVerifiedException(),
                            });
                    }
                    extra = { user: user as User };
                }
                return await func(parent, args, context, info, extra);
            }

            return returnError({
                errorMessage: LOGIN_REQUIRED_EXCEPTION,
                exceptionMessage: LoginRequiredException(),
            });
        };
    };
}
