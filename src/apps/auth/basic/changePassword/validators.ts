import * as yup from 'yup';
import { passwordValidator } from '../validators';

export const changePasswordArgsValidator = yup.object().shape({
    oldPassword: yup.string(),
    newPassword: passwordValidator,
});
