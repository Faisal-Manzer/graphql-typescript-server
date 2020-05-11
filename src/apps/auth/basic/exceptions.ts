import { Exception } from 'utils/exceptionGenerator';

export const PASSWORD_GUESSABLE_EXCEPTION = 'PasswordGuessableException';
export const PasswordGuessableException = Exception.generator({
    code: PASSWORD_GUESSABLE_EXCEPTION,
    message: 'Password can be easily guessed, try another password',
    path: 'password',
});

export const OLD_PASSWORD_USED_EXCEPTION = 'OldPasswordUsedException';
export const OldPasswordUsedException = Exception.generator({
    code: OLD_PASSWORD_USED_EXCEPTION,
    message: 'The password was changed recently. Try resetting the password',
    path: 'password',
});

export const INVALID_CREDENTIALS_EXCEPTION = 'InvalidCredentialsException';
export const InvalidCredentialsException = Exception.generator({
    code: INVALID_CREDENTIALS_EXCEPTION,
    message: 'Either email or password is incorrect',
});

export const NO_CREDENTIALS_FOUND_EXCEPTION = 'NoCredentialsFoundException';
export const NoCredentialsFoundException = Exception.generator({
    code: NO_CREDENTIALS_FOUND_EXCEPTION,
    message: 'No credentials found for given account',
});

export const INVALID_OTP_EXCEPTION = 'InvalidOTPException';
export const InvalidOTPException = Exception.generator({
    code: INVALID_OTP_EXCEPTION,
    message: 'OTP entered is wrong',
    path: 'otp',
});

export const RESET_FAILED_ATTEMPT_EXCEPTION = 'ResetFailedAttemptException';
export const ResetFailedAttemptException = Exception.generator({
    code: RESET_FAILED_ATTEMPT_EXCEPTION,
    message: 'You have reached maximum limit of failed attempt',
});
