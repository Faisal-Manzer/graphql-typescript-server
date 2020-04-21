import * as yup from 'yup';

export const emailValidator = yup
    .string()
    .required('Email is required')
    .email('Email is not valid')
    .max(255, 'Email should have max length of 255');

export const nameValidator = yup.string().required('Name is required').max(49, 'Name should be max of 49 chars');

export const registerParmValidator = yup.object().shape({
    emails: yup.array().required().of(emailValidator),
    name: nameValidator,
});
