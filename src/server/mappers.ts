import { join as joinPath, basename } from 'path';
import { sync as globSync } from 'glob';
import { readFileSync } from 'fs';
import { makeExecutableSchema } from 'graphql-tools';
import { mergeResolvers, mergeTypes } from 'merge-graphql-schemas';
import { importSchema } from 'graphql-import';
import { Application } from 'express';
import { GraphQLSchema } from 'graphql';
import { isTest } from './constants';

const pathToModules = joinPath(__dirname, '../apps');

const onlyTestFilter = (pattern: RegExp) => (path: string): boolean => {
    if (isTest) return true;
    else if (basename(path).match(pattern)) return false;
    return true;
};

export const generateTypeDefs = (): any => {
    const graphqlTypes = globSync(`${pathToModules}/**/*.@(gql|graphql)`)
        .filter(onlyTestFilter(/^test\.schema\.(gql|graphql)$/))
        .map((schema: string) => importSchema(readFileSync(schema, { encoding: 'utf8' })));

    return mergeTypes(graphqlTypes);
};

export const generateResolverSchema = (): any => {
    const resolvers = globSync(`${pathToModules}/**/?(*.)resolvers.?s`)
        .filter(onlyTestFilter(/^test\.resolvers\.[jt]s$/))
        .map((resolver: string) => require(resolver).default);
    return mergeResolvers(resolvers);
};

export const generateSchemaDirectives = (): any => {
    let schemaDirectives = {};
    globSync(`${pathToModules}/**/?(*.)directives.?s`)
        .filter(onlyTestFilter(/^test\.directives\.[jt]s$/))
        .map((directive: string) => {
            schemaDirectives = {
                ...schemaDirectives,
                ...require(directive).default,
            };
        });
    return schemaDirectives;
};

export const generateMiddlewares = (): any => {
    return globSync(`${pathToModules}/**/?(*.)middlewares.?s`)
        .filter(onlyTestFilter(/^test\.middlewares\.[jt]s$/))
        .map((middlewares: string) => require(middlewares).default);
};

export const generateSchema = (): GraphQLSchema =>
    makeExecutableSchema({
        typeDefs: generateTypeDefs(),
        resolvers: generateResolverSchema(),
        schemaDirectives: generateSchemaDirectives(),
    });

export const hookViews = (express: Application): void => {
    const patterns = globSync(`${pathToModules}/**/?(*.)views.?s`)
        .filter(onlyTestFilter(/^test\.views\.[jt]s$/))
        .map((views: string) => require(views).default);

    patterns.map((app) => {
        for (const method in app) {
            if (app.hasOwnProperty(method)) {
                // @ts-ignore
                app[method].map((viewConf) => express[method](...viewConf));
            }
        }
    });
};

export const getTemplateDirs = (): Array<string> => {
    return globSync(`${pathToModules}/**/?(*.)templates`);
};
