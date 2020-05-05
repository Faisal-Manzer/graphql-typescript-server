import * as yup from 'yup';
import { ValidationException } from './exceptions';

describe('validation exception', () => {
    test('validation of objects', async () => {
        const obj = {};
        const message = 'required';
        const validator = yup.object().shape({
            name: yup.string().required(message),
            email: yup.string().required(message),
        });

        try {
            await validator.validate(obj, { abortEarly: false });
        } catch (e) {
            const exception = ValidationException(e);
            expect(exception).toEqual([
                {
                    code: 'ValidationException',
                    message,
                    path: 'name',
                    data: { value: undefined },
                },
                {
                    code: 'ValidationException',
                    message,
                    path: 'email',
                    data: { value: undefined },
                },
            ]);
        }
    });

    test('validation of single element', async () => {
        const variable = 'str';
        const message = 'minimum';
        const validator = yup.string().min(10, message);
        try {
            await validator.validate(variable);
        } catch (e) {
            const exception = ValidationException(e);
            expect(exception).toEqual([
                {
                    code: 'ValidationException',
                    message,
                    path: null,
                    data: { value: variable },
                },
            ]);
        }
    });
});
