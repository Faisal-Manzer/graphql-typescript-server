import { toTitleCase, variableOrArray } from './funcs';

describe('variableOrArray', () => {
    test('variable to array', () => {
        const variable = 'some value';
        expect(variableOrArray(variable)).toEqual([variable]);
    });

    test('variable to array', () => {
        const arr = ['some value'];
        expect(variableOrArray(arr)).toEqual(arr);
    });
});

describe('title case', () => {
    test('single word', () => {
        const name = 'john';
        expect(toTitleCase(name)).toEqual('John');
    });

    test('multiple word', () => {
        const name = 'john doe';
        expect(toTitleCase(name)).toEqual('John Doe');
    });

    test('from upper case', () => {
        const name = 'jOhN Doe';
        expect(toTitleCase(name)).toEqual('John Doe');
    });
});
