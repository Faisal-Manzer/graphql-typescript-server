import { Exception } from 'utils/exceptionGenerator';

export const PASSWORD_GUESSABLE_EXCEPTION = 'PasswordGuessableException';
export const PasswordGuessableException = Exception.generator({
    code: PASSWORD_GUESSABLE_EXCEPTION,
    message: 'Password can be easily guessed, try another password',
    path: 'password',
});
