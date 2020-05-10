import * as yup from 'yup';
import { emailValidator, nameValidator } from '../validators';

export const passwordValidator = yup
    .string()
    .required('Password is required.')
    .min(6, 'Password should minimum 6 digit.')
    .max(255, 'Password should be maximum 255.');

export const otpValidator = yup
    .number()
    .required('Otp is required')
    .integer('Otp must be integer')
    .test('len', 'Otp should be of 6 digit', (val) => val.toString().length === 6);

export const registerWithPasswordArgsValidator = yup.object().shape({
    password: passwordValidator,
    email: emailValidator,
    name: nameValidator,
});

export const forgotPasswordArgsValidator = yup.object().shape({
    email: emailValidator,
    password: passwordValidator,
    otp: otpValidator,
});

export const changePasswordArgsValidator = yup.object().shape({
    oldPassword: yup.string(),
    newPassword: passwordValidator,
});
