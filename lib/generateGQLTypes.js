import { generateNamespace } from '@gql2ts/from-schema';
import { writeFile } from 'fs';
import { join as joinPath } from 'path';

import { generateTypeDefs } from '../src/server/loaders';

const typescriptTypes = generateNamespace('GQL', generateTypeDefs());
writeFile(joinPath(__dirname, '../src/types/schema.d.ts'), typescriptTypes, (err) => {
    if (err) console.log(err);
});
