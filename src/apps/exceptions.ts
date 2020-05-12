import { ValidationError as YupValidationError } from 'yup';
import { Exception } from 'utils/exceptionGenerator';
import { IException } from 'types';

export const VALIDATION_EXCEPTION = 'ValidationException';
export const ValidationException = (errors: YupValidationError): IException[] => {
    if (errors.inner.length > 0)
        return errors.inner.map(
            ({ message, path, value }): IException =>
                Exception.generator({
                    code: VALIDATION_EXCEPTION,
                    message,
                })({ path, data: { value } }),
        );

    return [
        Exception.generator({
            code: VALIDATION_EXCEPTION,
            message: errors.message,
        })({ path: null, data: { value: errors.value } }),
    ];
};

export const UNKNOWN_EXCEPTION = 'UnknownException';
export const UnknownException = Exception.generator({
    message: 'An unknown error occurred',
    code: UNKNOWN_EXCEPTION,
});

export const LOGIN_REQUIRED_EXCEPTION = 'LoginRequiredException';
export const LoginRequiredException = Exception.generator({
    message: 'You must login to use this resource.',
    code: LOGIN_REQUIRED_EXCEPTION,
});
export const USER_NOT_VERIFIED = 'UserNotVerifiedException';
export const UserNotVerifiedException = Exception.generator({
    code: USER_NOT_VERIFIED,
    message: 'User not verified. Check your mail box.',
});
