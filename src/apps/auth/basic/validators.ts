import * as yup from 'yup';

export const passwordValidator = yup
    .string()
    .required('Password is required.')
    .min(6, 'Password should minimum 6 digit.')
    .max(255, 'Password should be maximum 255.');
