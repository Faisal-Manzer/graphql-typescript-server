import { ExceptionGenerator } from 'utils/exceptionGenerator';

export const USER_EXISTS_EXCEPTION = 'UserExistsException';
export const UserExistsException = ExceptionGenerator({
    code: USER_EXISTS_EXCEPTION,
    message: 'User you are trying to create exists. Try with another email.',
});
