import { ValidationError as YupvalidationError } from 'yup';

interface Exception {
    code: string;
    message?: string | null;
    path?: string | null;
    data?: {
        [key: string]: any;
    };
}

type ExceptionFunction = (defaults: Partial<Exception>) => (details: Partial<Exception> | undefined) => Exception;

export const ExceptionGenerator: ExceptionFunction = (defaults) => (details = {}): any => ({
    ...defaults,
    ...details,
});

export const VALIDATION_EXCEPTION = 'ValidationException';
export const ValidationException = (errors: YupvalidationError): Exception[] => {
    return errors.inner.map(
        ({ message, path, value }): Exception =>
            ExceptionGenerator({
                code: VALIDATION_EXCEPTION,
                message,
            })({ path, data: { value } }),
    );
};
