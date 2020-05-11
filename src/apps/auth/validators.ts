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
    redirect: yup
        .string()
        .required('Redirect is required')
        .matches(
            /^(?:([a-z0-9+.-]+):\/\/)(?:\S+(?::\S*)?@)?(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/,
            'Redirect is not a valid url.',
        ),
});
