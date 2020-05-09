import { IException, IExceptions, IDone } from 'types';

export class Exception {
    private _exception: IException[] = [];
    __typename = 'Exceptions';

    get exception(): IExceptions {
        return {
            exceptions: this._exception,
            __typename: this.__typename,
        };
    }

    add(exceptions: IException[] | IException | IExceptions): void {
        if (Array.isArray(exceptions)) {
            this._exception = [...this._exception, ...exceptions];
        } else if ('exceptions' in exceptions && exceptions?.exceptions) {
            this._exception.push(...exceptions.exceptions);
        } else {
            this._exception.push(exceptions as IException);
        }
    }

    get hasException(): boolean {
        return this._exception.length > 0;
    }

    static generator(defaults: Partial<IException>): Function {
        return function (details: Partial<IException> = {}): any {
            return {
                ...defaults,
                ...details,
            };
        };
    }

    static new(exceptions: IException[] | IException | IExceptions): IExceptions {
        const e = new Exception();
        e.add(exceptions);
        return e.exception;
    }
}

export const Done = (done = true): IDone => ({ done });
