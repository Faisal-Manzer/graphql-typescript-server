import { Exception } from 'utils/exceptionGenerator';

export const RESET_FAILED_ATTEMPT_EXCEPTION = 'ResetFailedAttemptException';
export const ResetFailedAttemptException = Exception.generator({
    code: RESET_FAILED_ATTEMPT_EXCEPTION,
    message: 'You have reached maximum limit of failed attempt',
});

export const INVALID_OTP_EXCEPTION = 'InvalidOTPException';
export const InvalidOTPException = Exception.generator({
    code: INVALID_OTP_EXCEPTION,
    message: 'OTP entered is wrong',
    path: 'otp',
});
