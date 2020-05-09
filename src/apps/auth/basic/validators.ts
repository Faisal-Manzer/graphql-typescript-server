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
    .max(6, 'Otp should be 6 digit')
    .min(6, 'Otp should be 6 digit');

export const registerWithPasswordArgsValidator = yup.object().shape({
    password: passwordValidator,
    email: emailValidator,
    name: nameValidator,
});

export const resetPasswordArgsValidator = yup.object().shape({
    email: emailValidator,
    password: passwordValidator,
    otp: otpValidator,
});

export const changePasswordArgsValidator = yup.object().shape({
    oldPassword: yup.string(),
    newPassword: passwordValidator,
});
