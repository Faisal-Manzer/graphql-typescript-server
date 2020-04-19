import { Connection } from 'typeorm';
import { PostgresConnectionOptions as DBOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { Redis } from 'ioredis';
import { GraphQLSchema } from 'graphql';
import { Application } from 'express';
import { CorsOptions } from 'cors';

import { GraphQLServer } from 'graphql-yoga';

import { Server as HttpServer, Context, ContextProvider } from '@types';

import { dbConnect } from './db';
import { redis } from './redis';
import { schema } from './schema';
import { middlewares } from './middlewares';

export class Server {
    db: Connection;
    redis: Redis;

    schema: GraphQLSchema;
    cors: CorsOptions;

    server: GraphQLServer;
    express: Application;
    app: HttpServer;

    constructor(
        public databaseConfig: Partial<DBOptions> = {},
        public port: string | number = process.env.PORT || 4000,
        public type: string = process.env.NODE_ENV || 'development',
    ) {}

    async config(): Promise<void> {
        this.db = await this.dbConfigure();
        this.redis = redis;
        this.schema = schema;

        this.server = new GraphQLServer({
            schema: this.schema,
            context: this.getServerContext,
        });

        this.cors = this.getCorsSettings();
        this.express = this.server.express;
        this.configureApp(this.server.express);
        this.addMiddlewares(this.server.express);
    }

    async dbConfigure(): Promise<Connection> {
        return await dbConnect(
            {
                host: process.env.DB_HOST,
                port: parseInt(process.env.DB_PORT || '5432'),
                username: process.env.DB_USER,
                password: process.env.DB_PASS,
                database: process.env.NODE_ENV === 'test' ? process.env.TEST_DB_NAME : process.env.DB_NAME,
                ...this.databaseConfig,
            },
            this.type,
        );
    }

    getCorsSettings(): CorsOptions {
        return { credentials: true, origin: [] };
    }

    getServerContext({ request }: ContextProvider): Context {
        return {
            redis: this.redis,
            request,
            session: request.session,
        };
    }

    configureApp(express: Application): void {
        express.disable('x-powered-by');
        express.set('trust proxy', 1);
    }

    addMiddlewares(express: Application): void {
        middlewares.map((middleware) => express.use(middleware));
    }

    async start(): Promise<HttpServer> {
        await this.config();
        this.app = await this.server.start({ port: this.port, cors: this.cors });
        return this.app;
    }
}
