import { generateNamespace } from '@gql2ts/from-schema';
import { readFileSync, writeFile } from 'fs';
import { join as joinPath } from 'path';

import { sync as globSync } from 'glob';
import { importSchema } from 'graphql-import';
import { mergeTypes } from 'merge-graphql-schemas';

export const generateSchema = (): any => {
    const pathToModules = joinPath(__dirname, '../src/modules');

    const graphqlTypes = globSync(`${pathToModules}/**/*.gql`).map((schema: string) =>
        importSchema(readFileSync(schema, { encoding: 'utf8' })),
    );
    const typeDefs = mergeTypes(graphqlTypes);
    return typeDefs;
};

const typescriptTypes = generateNamespace('GQL', generateSchema());
writeFile(joinPath(__dirname, '../src/types/schema.d.ts'), typescriptTypes, (err) => {
    if (err) console.log(err);
});
