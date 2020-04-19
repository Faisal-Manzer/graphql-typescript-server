import { Redis } from 'ioredis';
import { Request as ExpressRequest, Express } from 'express';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';

export type Server = HttpServer | HttpsServer;

export type Session = Express.Session;

export interface Request extends ExpressRequest {
    session: Session;
}
export interface ContextProvider {
    request: Request;
}

export interface Context {
    redis: Redis;
    request: Request;
    session: Session;
}
