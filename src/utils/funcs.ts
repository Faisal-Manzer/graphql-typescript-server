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
    equalityTester: Function = (find: any, value: any): boolean => find === value,
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

export const getRandomInt = (min: number, max: number): number => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
};

export const millisecondsToStr = (milliseconds: number): string => {
    const numberEnding = (number: number): string => {
        return number > 1 ? 's' : '';
    };

    let temp = Math.floor(milliseconds / 1000);
    const years = Math.floor(temp / 31536000);
    if (years) {
        return years + ' year' + numberEnding(years);
    }

    const days = Math.floor((temp %= 31536000) / 86400);
    if (days) {
        return days + ' day' + numberEnding(days);
    }
    const hours = Math.floor((temp %= 86400) / 3600);
    if (hours) {
        return hours + ' hour' + numberEnding(hours);
    }
    const minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
        return minutes + ' minute' + numberEnding(minutes);
    }
    const seconds = temp % 60;
    if (seconds) {
        return seconds + ' second' + numberEnding(seconds);
    }
    return 'less than a second'; //'just now' //or other string you like;
};
