import * as yup from 'yup';
import { emailValidator } from 'apps/auth/validators';

import { passwordValidator } from '../validators';

export const otpValidator = yup
    .number()
    .required('Otp is required')
    .integer('Otp must be integer')
    .test('len', 'Otp should be of 6 digit', (val) => val.toString().length === 6);

export const forgotPasswordArgsValidator = yup.object().shape({
    email: emailValidator,
    password: passwordValidator,
    otp: otpValidator,
});
