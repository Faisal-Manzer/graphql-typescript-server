import * as yup from 'yup';

import { toTitleCase } from 'utils/funcs';

export const emailValidator = yup
    .string()
    .required('Email is required')
    .email('Email is not valid')
    .max(255, 'Email should have max length of 255')
    .transform((email) => email.toLowerCase());

export const nameValidator = yup
    .string()
    .required('Name is required')
    .max(49, 'Name should be max of 49 chars')
    .transform(toTitleCase);

export const registerParmValidator = yup.object().shape({
    email: emailValidator,
    name: nameValidator,
});

export const sendConfMailParmValidator = yup.object().shape({
    email: emailValidator,
    redirect: yup.string().required('Redirect is required').url('Redirect is not a valid url.'),
});
