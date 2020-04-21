export function variableOrArray<T>(variable: T | T[]): T[] {
    const arr: T[] = [];
    if (!Array.isArray(variable)) arr.push(variable as T);
    else arr.push(...(variable as T[]));

    return arr;
}
