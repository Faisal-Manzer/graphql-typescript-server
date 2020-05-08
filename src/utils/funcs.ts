import { redis } from 'server/redis';

export function variableOrArray<T>(variable: T | T[]): T[] {
    const arr: T[] = [];
    if (!Array.isArray(variable)) arr.push(variable as T);
    else arr.push(...(variable as T[]));

    return arr;
}

export const toTitleCase = (str: string): string => {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

export const getRedisKeyForValue = async (
    keyPrefix: string,
    find: any,
    equalityTester: Function,
    silent = true,
): Promise<string | null> => {
    const keyPattern = `${keyPrefix}:*`;

    const allKeys = await redis.keys(keyPattern);
    for (const key of allKeys) {
        const value = await redis.get(key);
        if (equalityTester(find, value)) return key.replace(`${keyPrefix}:`, '');
    }

    if (silent) return null;
    throw new Error('No key found');
};

export const addHttp = (url: string): string => {
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
        url = 'http://' + url;
    }
    return url;
};
