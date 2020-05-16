import { IExceptions } from 'types';

// @ts-ignore
import { test as isCommonPassword } from 'fxa-common-password-list';

import { ResolverMap } from 'types/graphql-utils';
import { Exception } from 'utils/exceptionGenerator';

import { User } from 'apps/entities/User';
import { ValidationException, UnknownException } from 'apps/exceptions';
import { register } from 'apps/auth/utils';
import { googleRecaptchaValidator } from 'apps/auth/recaptcha';
import { RecaptchaNotValidException } from 'apps/auth/exceptions';

import { BasicAuth } from '../entities/BasicAuth';

import { registerWithPasswordArgsValidator } from './validators';
import { PasswordGuessableException } from './exceptions';

const Resolvers: ResolverMap = {
    Mutation: {
        register: async (_, args: GQL.IRegisterOnMutationArguments, { ip }): Promise<User | IExceptions> => {
            const e = new Exception();
            const { email, password, name } = args;

            if (!(await googleRecaptchaValidator(args?.captcha, ip))) e.add(RecaptchaNotValidException());

            if (isCommonPassword(password)) e.add(PasswordGuessableException({}));
            if (password === email) e.add(PasswordGuessableException({}));

            try {
                await registerWithPasswordArgsValidator.validate(args, { abortEarly: false });
            } catch (validationException) {
                e.add(ValidationException(validationException));
            }

            if (e.hasException) return e.exception;

            try {
                const user = await register({ email, name });

                const basicAuth = new BasicAuth();
                basicAuth.user = user;
                await basicAuth.setPassword(password);
                await basicAuth.save();

                return user;
            } catch (exceptions) {
                console.log(exceptions);
                if (Array.isArray(exceptions)) e.add(exceptions);
                else e.add(UnknownException({}));
            }

            return e.exception;
        },
    },
};

export default Resolvers;
