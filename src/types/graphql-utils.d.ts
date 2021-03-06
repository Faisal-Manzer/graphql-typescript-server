import { Redis } from 'ioredis';
import { User } from 'apps/entities/User';
import { Request } from 'express';

export interface Session extends Express.Session {
    user: User;
}

export interface ResolverContext {
    redis: Redis;
    host: string;
    session: Session;
    ip: string;
    request: Request;
    user: User;
}

export type Resolver = (parent: any, args: any, context: ResolverContext, info: any, extra?: any) => any;
export interface ResolverMap {
    [key: string]: {
        [key: string]: Resolver;
    };
}
