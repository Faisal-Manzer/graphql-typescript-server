import { defaultFieldResolver, GraphQLField } from 'graphql';
import { SchemaDirectiveVisitor } from 'graphql-tools';

import { IExceptions } from 'types';

import { Exception } from 'utils/exceptionGenerator';
import { isTest } from 'server/constants';

import { LoginRequiredException, UserNotVerifiedException } from './exceptions';
import { findUserById } from './utils';
import { getUserIDFromRequest } from './auth/jwt.utils';

class LoginRequiredDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field: GraphQLField<any, any>): GraphQLField<any, any> | void | null {
        const { resolve = defaultFieldResolver } = field;
        const { exception = false, verified = true } = this.args;

        const returnError = (e = LoginRequiredException()): null | IExceptions => {
            if (exception) return Exception.new(e);
            return null;
        };

        field.resolve = async function (parent, args, context, info): Promise<any> {
            let userId = context.session.userId;
            if (!userId) userId = getUserIDFromRequest(context.request);

            const user = await findUserById(userId);
            if (!user) return returnError();

            if (verified && !user.verified) return returnError(UserNotVerifiedException());
            return resolve.apply(this, [parent, args, { ...context, user }, info]);
        };
    }
}

class TestOnlyDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field: GraphQLField<any, any>): GraphQLField<any, any> | void | null {
        const { resolve = defaultFieldResolver } = field;
        field.resolve = async function (...args): Promise<any> {
            if (isTest) return resolve.apply(this, args);
            return null;
        };
    }
}

export default {
    loginRequired: LoginRequiredDirective,
    testOnly: TestOnlyDirective,
};
