import * as yup from 'yup';
import { emailValidator, nameValidator } from '../validators';

export const passwordValidator = yup
    .string()
    .required('Password is required.')
    .min(6, 'Password should minimum 6 digit.')
    .max(255, 'Password should be maximum 255.');

export const registerWithPasswordArgumentsValidator = yup.object().shape({
    password: passwordValidator,
    email: emailValidator,
    name: nameValidator,
});
