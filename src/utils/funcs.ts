export function variableOrArray<T>(variable: T | T[]): T[] {
    const arr: T[] = [];
    if (!Array.isArray(variable)) arr.push(variable as T);
    else arr.push(...(variable as T[]));

    return arr;
}

export function toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}
