import { Connection } from 'typeorm';
import { PostgresConnectionOptions as DBOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { Redis } from 'ioredis';
import { GraphQLSchema } from 'graphql';
import { Application } from 'express';
import { CorsOptions } from 'cors';

import { GraphQLServer } from 'graphql-yoga';

import { Server as HttpServer, Context, ContextProvider } from 'types';

import { dbConnect } from './db';
import { redis } from './redis';
import { generateMiddlewares, generateSchema, hookViews } from './schema';
import { middlewares } from './middlewares';
import { corsOrigins } from './cors';

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
        this.schema = generateSchema();

        this.server = new GraphQLServer({
            schema: this.schema,
            context: this.getServerContext,
            middlewares: generateMiddlewares(),
        });

        this.cors = this.getCorsSettings();
        this.express = this.server.express;
        this.configureApp();
        this.addMiddleware();
    }

    async dbConfigure(): Promise<Connection> {
        return await dbConnect(this.databaseConfig);
    }

    getCorsSettings(): CorsOptions {
        return { credentials: true, origin: corsOrigins };
    }

    getServerContext({ request }: ContextProvider): Context {
        return {
            redis: this.redis,
            request,
            host: `${request.protocol}://${request.get('host')}`,
            session: request.session,
            ip: request.ip,
        };
    }

    configureApp(): void {
        this.server.express.disable('x-powered-by');
        this.server.express.set('trust proxy', 1);
    }

    addMiddleware(): void {
        middlewares.map((middleware) => this.server.express.use(middleware));
        hookViews(this.server.express);
    }

    async start(): Promise<HttpServer> {
        await this.config();
        this.app = await this.server.start({ port: this.port, cors: this.cors });
        return this.app;
    }
}
