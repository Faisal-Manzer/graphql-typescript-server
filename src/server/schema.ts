import { join as joinPath } from 'path';
import { sync as globSync } from 'glob';
import { readFileSync } from 'fs';
import { makeExecutableSchema } from 'graphql-tools';
import { mergeResolvers, mergeTypes } from 'merge-graphql-schemas';
import { importSchema } from 'graphql-import';
import { Application } from 'express';

const pathToModules = joinPath(__dirname, '../apps');

export const generateTypeDefs = (): any => {
    const graphqlTypes = globSync(`${pathToModules}/**/*.@(gql|graphql)`).map((schema: string) =>
        importSchema(readFileSync(schema, { encoding: 'utf8' })),
    );
    return mergeTypes(graphqlTypes);
};

export const generateResolverSchema = (): any => {
    const resolvers = globSync(`${pathToModules}/**/?(*.)resolvers.?s`).map(
        (resolver: string) => require(resolver).Resolvers,
    );
    return mergeResolvers(resolvers);
};

export const generateSchema = (): any => {
    return makeExecutableSchema({ typeDefs: generateTypeDefs(), resolvers: generateResolverSchema() });
};

export const hookViews = (express: Application): any => {
    const patterns = globSync(`${pathToModules}/**/?(*.)views.?s`).map(
        (resolver: string) => require(resolver).urlPatterns,
    );

    patterns.map((app) => {
        app.map((pattern: any) => {
            const [url, view, method = 'get'] = pattern;
            // @ts-ignore
            express[method](url, view);
        });
    });
};
