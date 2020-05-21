import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
import { MAX_SESSION_EXPIRY } from 'server/constants';

export const getJWT = (userId: string | undefined): string => {
    if (!userId) return '';
    return jwt.sign({ id: userId }, process.env.SECRET_KEY as string, {
        expiresIn: MAX_SESSION_EXPIRY / 1000,
    });
};

export const verifyToken = (token: string): string | undefined => {
    try {
        const payload = jwt.verify(token, process.env.SECRET_KEY as string);
        // @ts-ignore
        return payload.id;
    } catch (e) {}
    return undefined;
};

export const getUserIDFromRequest = (request: Request): string | undefined => {
    const header = request.get('Authorization') || '';
    let token;
    if (header.startsWith('Bearer ')) token = header.slice(7, header.length);
    else return undefined;
    if (!token) return undefined;
    return verifyToken(token);
};
