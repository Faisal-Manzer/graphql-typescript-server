import { ValidationError as YupValidationError } from 'yup';
import { Exception } from 'utils/exceptionGenerator';
import { IException } from 'types';

export const VALIDATION_EXCEPTION = 'ValidationException';
export const ValidationException = (errors: YupValidationError): IException[] => {
    return errors.inner.map(
        ({ message, path, value }): IException =>
            Exception.generator({
                code: VALIDATION_EXCEPTION,
                message,
            })({ path, data: { value } }),
    );
};

export const UNKNOWN_EXCEPTION = 'UnknownException';
export const UnknownException = Exception.generator({
    message: 'An unknown error occurred',
    code: UNKNOWN_EXCEPTION,
});
