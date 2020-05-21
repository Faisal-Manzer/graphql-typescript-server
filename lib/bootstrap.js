#!/usr/bin/env node

const { program } = require('commander');
const { join } = require('path');
const { writeFile, mkdir } = require('fs');

const BASE_DIR = join(process.cwd(), 'src', 'apps');

let app = '';
program
    .version('1.0.0')
    .arguments('<app>')
    .action((appName) => {
        app = appName;
    })
    .parse(process.argv);

if (!app) {
    console.log('App name is required');
    process.exitCode(1);
}

const schema = `
type Query {
    ${app}: String!
}
`;

const resolver = `import { ResolverMap } from 'types/graphql-utils';

const Resolvers: ResolverMap = {
    Query: {
        ${app}: (): string => '${app}',
    },
};

export default Resolvers;
`;

const test = `import { TestClient } from 'utils/testClient';

const ${app}Query = (): string => \`
    query {
        ${app}
    }
\`;

describe('${app}', () => {
    test('${app}', async () => {
        const session = new TestClient();
        const response = await session.query(${app}Query());
        expect(response.${app}).toEqual('${app}');
    });
});
`;

mkdir(join(BASE_DIR, app), { recursive: true }, function (err) {
    if (err) throw err;
});

writeFile(join(BASE_DIR, app, 'resolvers.ts'), resolver, { flag: 'w+' }, function (err) {
    if (err) throw err;
});

writeFile(join(BASE_DIR, app, 'schema.gql'), schema, { flag: 'w+' }, function (err) {
    if (err) throw err;
});

writeFile(join(BASE_DIR, app, `${app}.test.ts`), test, { flag: 'w+' }, function (err) {
    if (err) throw err;
});
