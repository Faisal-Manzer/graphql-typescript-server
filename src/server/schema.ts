import { join as joinPath } from 'path';
import { sync as globSync } from 'glob';
import { readFileSync } from 'fs';
import { makeExecutableSchema } from 'graphql-tools';
import { mergeResolvers, mergeTypes } from 'merge-graphql-schemas';
import { importSchema } from 'graphql-import';

export const generateTypeDefs = (): any => {
    const pathToModules = joinPath(__dirname, '../apps');

    const graphqlTypes = globSync(`${pathToModules}/**/*.@(gql|graphql)`).map((schema: string) =>
        importSchema(readFileSync(schema, { encoding: 'utf8' })),
    );
    return mergeTypes(graphqlTypes);
};

export const generateResolverSchema = (): any => {
    const pathToModules = joinPath(__dirname, '../apps');

    const resolvers = globSync(`${pathToModules}/**/?(*.)resolvers.?s`).map(
        (resolver: string) => require(resolver).Resolvers,
    );
    return mergeResolvers(resolvers);
};

export const generateSchema = (): any => {
    return makeExecutableSchema({ typeDefs: generateTypeDefs(), resolvers: generateResolverSchema() });
};
