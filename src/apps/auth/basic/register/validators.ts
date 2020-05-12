import * as yup from 'yup';
import { emailValidator, nameValidator } from 'apps/auth/validators';
import { passwordValidator } from '../validators';

export const registerWithPasswordArgsValidator = yup.object().shape({
    password: passwordValidator,
    email: emailValidator,
    name: nameValidator,
    recaptcha: yup.string(),
});
